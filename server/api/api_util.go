package api

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/hauke96/simple-task-manager/server/websocket"
	"github.com/pkg/errors"
	"net/http"
)

type ApiResponse struct {
	statusCode int
	data       interface{}
}

func BadRequestError(err error) *ApiResponse {
	return &ApiResponse{
		statusCode: http.StatusBadRequest,
		data:       err,
	}
}

func InternalServerError(err error) *ApiResponse {
	return &ApiResponse{
		statusCode: http.StatusInternalServerError,
		data:       err,
	}
}

func JsonResponse(data interface{}) *ApiResponse {
	return &ApiResponse{
		statusCode: http.StatusOK,
		data:       data,
	}
}

func EmptyResponse() *ApiResponse {
	return &ApiResponse{
		statusCode: http.StatusOK,
		data:       nil,
	}
}

func printRoutes(router *mux.Router) {
	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()
		sigolo.Info("  %-*v %s", 7, methods, path)
		return nil
	})
}

func authenticatedTransactionHandler(handler func(r *http.Request, context *Context) *ApiResponse) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		prepareAndHandle(w, r, handler)
	}
}

func authenticatedWebsocket(handler func(w http.ResponseWriter, r *http.Request, token *auth.Token, websocketSender *websocket.WebsocketSender)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		t := query.Get("token")
		if t == "" || t == "null" || t == "\u009e" {
			err := errors.New("could not establish websocket connection: query parameter 'token' not set")
			util.ResponseUnauthorized(w, err)
			return
		}
		query.Del("token")

		// Add token query param value (set by websocket clients) as authorization so that verifyRequest can check it.
		r.Header.Add("Authorization", t)

		token, err := auth.VerifyRequest(r)
		if err != nil {
			sigolo.Error("Token verification failed: %s", err)
			// No further information to caller (which is a potential attacker)
			util.ResponseUnauthorized(w, errors.New("No valid authentication token found"))
			return
		}

		sender := websocket.Init(util.GetLogTraceId())

		handler(w, r, token, sender)
	}
}

// prepareAndHandle gets and verifies the token from the request, creates the context, starts a transaction, manages
// commit/rollback, calls the handler and also does error handling. When this function returns, everything should have a
// valid state: The response as well as the transaction (database).
func prepareAndHandle(w http.ResponseWriter, r *http.Request, handler func(r *http.Request, context *Context) *ApiResponse) {
	token, err := auth.VerifyRequest(r)
	if err != nil {
		sigolo.Debug("URL without valid token called: %s", r.URL.Path)
		sigolo.Error("Token verification failed: %s", err)
		// No further information to caller (which is a potential attacker)
		util.ResponseUnauthorized(w, errors.New("No valid authentication token found"))
		return
	}

	// Create context with a new transaction and new service instances
	context, err := createContext(token)
	if err != nil {
		sigolo.Error("Unable to create context for call user from '%s' (%s) to %s %s: %s", token.User, token.UID, r.Method, r.URL.Path, err)
		sigolo.Stack(err)
		// No further information to caller (which is a potential attacker)
		util.ResponseInternalError(w, errors.New("Unable to create context"))
		return
	}

	context.Log("Call from '%s' (%s) to %s %s", token.User, token.UID, r.Method, r.URL.Path)

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

			context.Err(fmt.Sprintf("!! PANIC !! Recover from panic:"))
			context.Stack(err)

			util.ResponseInternalError(w, err)

			context.Log("Try to perform rollback")
			rollbackErr := context.Transaction.Rollback()
			if rollbackErr != nil {
				sigolo.Stack(errors.Wrap(rollbackErr, "error performing rollback"))
			}
		}
	}()

	// Call actual logic
	var response *ApiResponse
	response = handler(r, context)

	if response.statusCode != http.StatusOK {
		// Cause panic which will be recovered using the above function. This will then trigger a transaction rollback.
		panic(response.data.(error))
	}

	// Commit transaction
	err = context.Transaction.Commit()
	if err != nil {
		sigolo.Error("Unable to commit transaction: %s", err.Error())
		panic(err)
	}
	context.Debug("Committed transaction")

	if response.data != nil {
		encoder := json.NewEncoder(w)
		encoder.Encode(response.data)
	}
}
