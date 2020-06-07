package api

import (
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"net/http"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/util"
)

func printRoutes(router *mux.Router) {
	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()
		sigolo.Info("  %-*v %s", 7, methods, path)
		return nil
	})
}

func authenticatedHandler(handler func(w http.ResponseWriter, r *http.Request, token *auth.Token)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		verifyAndHandle(r, w, handler)
	}
}

func authenticatedWebsocket(handler func(w http.ResponseWriter, r *http.Request, token *auth.Token)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Add Sec-WebSocket-Protocol value (set by websocket clients) as authorization. Therefore the
		// "Sec-WebSocket-Protocol" value must contain the token.
		r.Header.Add("Authorization", r.Header.Get("Sec-WebSocket-Protocol"))

		verifyAndHandle(r, w, handler)
	}
}

func verifyAndHandle(r *http.Request, w http.ResponseWriter, handler func(w http.ResponseWriter, r *http.Request, token *auth.Token)) {
	token, err := auth.VerifyRequest(r)
	if err != nil {
		sigolo.Error("No valid authentication found: %s", err.Error())
		// No further information to caller (which is a potential attacker)
		util.Response(w, "No valid authentication found", http.StatusUnauthorized)
		return
	}

	sigolo.Info("User '%s' called %s on %s", token.User, r.Method, r.URL.Path)
	handler(w, r, token)
}