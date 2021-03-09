package api

import (
	"fmt"
	httpSwagger "github.com/swaggo/http-swagger"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/util"
)

var (
	supportedApiVersions = make([]string, 0)
)

func Init() error {
	// Register routes and print them
	router := mux.NewRouter()

	addInfoHandler(router)
	addDocHandler(router)
	addAuthLoginHandler(router)
	addAuthCallbackHandler(router)

	sigolo.Info("Registered general routes:")
	printRoutes(router)

	// Not supported anymore:
	// API v1
	// API v2
	// API v2.1
	// API v2.2
	// API v2.3
	// API v2.4
	// API v2.5
	// API v2.6

	// API v2.7
	router_v2_7, version := Init_v2_7(router)
	supportedApiVersions = append(supportedApiVersions, version)
	sigolo.Info("Registered routes for API %s:", version)
	printRoutes(router_v2_7)

	router.Methods(http.MethodOptions).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT")
		w.Header().Set("Access-Control-Allow-Request-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Request-Methods", "GET,POST,DELETE,PUT")
	})

	var err error
	if strings.HasPrefix(config.Conf.ServerUrl, "https") {
		sigolo.Info("Use HTTPS? yes")
		err = http.ListenAndServeTLS(":"+strconv.Itoa(config.Conf.Port), config.Conf.SslCertFile, config.Conf.SslKeyFile, router)
	} else {
		sigolo.Info("Use HTTPS? no")
		err = http.ListenAndServe(":"+strconv.Itoa(config.Conf.Port), router)
	}

	if err != nil {
		panic(err)
	}

	sigolo.Info("Start serving ...")

	return nil
}

// Info
// @Summary Shows very basic information about this server.
// @Version 2.7
// @Tags info
// @Produce text/plain
// @Success 200 {string} string "Some bunch of text with basic information about this server"
// @Router /info [GET]
func addInfoHandler(router *mux.Router) {
	router.HandleFunc("/info", getInfo).Methods(http.MethodGet)
}

// API documentation
// @Summary A Swagger UI with all kinds of API related information.
// @Version 2.7
// @Tags info
// @Produce text/html
// @Router /doc [GET]
func addDocHandler(router *mux.Router) {
	router.PathPrefix("/doc").Handler(httpSwagger.WrapHandler)
}

// OAuth login
// @Description Gets OSM login token and therefore redirects to the OSM Login page. See GitHub Repo under '/doc/authentication' for further information.
// @Version 2.7
// @Tags authentication
// @Param redirect query string true "The URL that should be redirected to after authentication"
// @Router /oauth_login [GET]
func addAuthLoginHandler(router *mux.Router) *mux.Route {
	return router.HandleFunc("/oauth_login", auth.OauthLogin).Methods(http.MethodGet)
}

// OAuth callback
// @Description OAuth callback called after OSM login. Performs the OAuth authentication by getting an OSM access token. See GitHub Repo under '/doc/authentication' for further information.
// @Version 2.7
// @Tags authentication
// @Param config query string true "The config key sent to the OSM login page."
// @Param redirect query string true "The URL that should be redirected to after authentication"
// @Router /oauth_callback [GET]
func addAuthCallbackHandler(router *mux.Router) *mux.Route {
	return router.HandleFunc("/oauth_callback", auth.OauthCallback).Methods(http.MethodGet)
}

func getInfo(w http.ResponseWriter, r *http.Request) {
	fmtStr := "%*s : %s\n"
	fmtColWidth := 22

	fmt.Fprintf(w, "SimpleTaskManager Server:\n")
	fmt.Fprintf(w, "=========================\n\n")
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Version", util.VERSION)
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Code", config.Conf.SourceRepoURL)
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Supported API versions", strings.Join(supportedApiVersions, ", "))
	fmt.Fprintf(w, fmtStr, fmtColWidth, "API doc (swagger)", fmt.Sprintf("%s:%d/doc/index.html", config.Conf.ServerUrl, config.Conf.Port))
}
