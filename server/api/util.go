package api

import (
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"
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
		query := r.URL.Query()

		t := query.Get("token")
		if t == "" {
			util.ResponseBadRequest(w, errors.New("query parameter 'token' not set"))
			return
		}
		query.Del("token")

		// Add token query param value (set by websocket clients) as authorization so that verifyAndHandle can check it.
		r.Header.Add("Authorization", t)

		verifyAndHandle(r, w, handler)
	}
}

func verifyAndHandle(r *http.Request, w http.ResponseWriter, handler func(w http.ResponseWriter, r *http.Request, token *auth.Token)) {
	token, err := auth.VerifyRequest(r)
	if err != nil {
		// No further information to caller (which is a potential attacker)
		util.ErrorResponse(w, errors.New("No valid authentication found"), http.StatusUnauthorized)
		return
	}

	sigolo.Info("User '%s' called %s on %s", token.User, r.Method, r.URL.Path)
	handler(w, r, token)
}