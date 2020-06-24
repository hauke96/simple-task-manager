package api

import (
	"database/sql"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/pkg/errors"
	"net/http"
)

type Context struct {
	token          *auth.Token
	transaction    *sql.Tx
	projectService *project.ProjectService
	taskService    *task.TaskService
}

func printRoutes(router *mux.Router) {
	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()
		sigolo.Info("  %-*v %s", 7, methods, path)
		return nil
	})
}

func authenticatedTransactionHandler(handler func(w http.ResponseWriter, r *http.Request, context *Context)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		prepareAndHandle(w, r, handler)
	}
}

func authenticatedWebsocket(handler func(w http.ResponseWriter, r *http.Request, token *auth.Token)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		t := query.Get("token")
		if t == "" {
			util.ResponseBadRequest(w, errors.New("query parameter 'token' not set"))
			return
		}
		query.Del("token")

		// Add token query param value (set by websocket clients) as authorization so that verifyRequest can check it.
		r.Header.Add("Authorization", t)

		token, err := auth.VerifyRequest(r)
		if err != nil {
			sigolo.Error("No valid authentication found: %s", err)
			// No further information to caller (which is a potential attacker)
			util.ErrorResponse(w, errors.New("No valid authentication found"), http.StatusUnauthorized)
			return
		}

		handler(w, r, token)
	}
}

// prepareAndHandle gets and verifies the token from the request, creates the context, starts a transaction, manages
// commit/rollback, calls the handler and also does error handling. When this function returns, everything should have a
// valid state: The response as well as the transaction (database).
func prepareAndHandle(w http.ResponseWriter, r *http.Request, handler func(w http.ResponseWriter, r *http.Request, context *Context)) {
	token, err := auth.VerifyRequest(r)
	if err != nil {
		// No further information to caller (which is a potential attacker)
		util.ErrorResponse(w, errors.New("No valid authentication found"), http.StatusUnauthorized)
		return
	}

	// Create context with a new transaction and new service instances
	context, err := createContext(token)
	if err != nil {
		sigolo.Error("Unable to create context: %s", err)
		// No further information to caller (which is a potential attacker)
		util.ResponseInternalError(w, errors.New("Unable to create context"))
		return
	}

	// Recover from panic and perform rollback on transaction
	defer func() {
		if r := recover(); r != nil {
			var err error
			switch r := r.(type) {
			case error:
				err = r
			default:
				err = fmt.Errorf("%v", r)
			}

			sigolo.Error(fmt.Sprintf("!! PANIC !! Recover from panic: %s", err.Error()))

			sigolo.Info("Try to perform rollback")
			err = context.transaction.Rollback()
			if err != nil {
				sigolo.Info("error performing rollback after panic: %s", err.Error())

				util.ResponseInternalError(w, errors.New("Fatal error occurred!"))
			}
		}
	}()

	// Call actual logic
	handler(w, r, context)
	// TODO Use (own?) response instead of ResponseWriter and capture error here

	// Commit transaction
	err = context.transaction.Commit()
	if err != nil {
		sigolo.Error("Unable to commit transaction: %s", err.Error())
		panic(err)
	}
	sigolo.Debug("Committed transaction")
}

// createContext starts a new transaction and creates new service instances which use this new transaction so that all
// services (also those calling each other) are using the same transaction.
func createContext(token *auth.Token) (*Context, error) {
	context := &Context{}
	context.token = token

	tx, err := database.GetTransaction()
	if err != nil {
		return nil, errors.Wrap(err, "error getting transaction")
	}
	context.transaction = tx

	permissionService := permission.Init(tx)
	context.taskService = task.Init(tx, permissionService)
	context.projectService = project.Init(tx, context.taskService, permissionService)

	return context, nil
}
