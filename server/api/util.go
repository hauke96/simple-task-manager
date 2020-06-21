package api

import (
	"database/sql"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/pkg/errors"
	"net/http"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/util"
)

type Context struct {
	token          *auth.Token
	transaction    *sql.Tx
	projectService *project.ProjectService
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

		token, err := auth.VerifyRequest(r)
		if err != nil {
			sigolo.Error("No valid authentication found: %s", err)
			// No further information to caller (which is a potential attacker)
			util.Response(w, "No valid authentication found", http.StatusUnauthorized)
			return
		}

		context, err := createContext(token)
		if err != nil {
			sigolo.Error("Unable to get transaction: %s", err)
			// No further information to caller (which is a potential attacker)
			util.Response(w, "Unable to get transaction", http.StatusUnauthorized)
			return
		}

		handler(w, r, context)
	}
}

func authenticatedWebsocket(handler func(w http.ResponseWriter, r *http.Request, context *Context)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		t := query.Get("token")
		if t == "" {
			util.ResponseBadRequest(w, "query parameter 'token' not set")
			return
		}
		query.Del("token")

		// Add token query param value (set by websocket clients) as authorization so that verifyRequest can check it.
		r.Header.Add("Authorization", t)

		token, err := auth.VerifyRequest(r)
		if err != nil {
			sigolo.Error("No valid authentication found: %s", err)
			// No further information to caller (which is a potential attacker)
			util.Response(w, "No valid authentication found", http.StatusUnauthorized)
			return
		}

		context, err := createContext(token)
		if err != nil {
			sigolo.Error("Unable to get transaction: %s", err)
			// No further information to caller (which is a potential attacker)
			util.Response(w, "Unable to get transaction", http.StatusUnauthorized)
			return
		}

		// TODO defer recover from panic and rollback transaction

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
}

func createContext(token *auth.Token) (*Context, error) {
	context := &Context{}
	context.token = token

	tx, err := database.GetTransaction()
	if err != nil {
		return nil, errors.Wrap(err, "error getting transaction")
	}
	context.transaction = tx

	// TODO create services
	context.projectService = project.Init(tx)

	return context, nil
}
