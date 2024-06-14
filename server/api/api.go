package api

import (
	"fmt"
	httpSwagger "github.com/swaggo/http-swagger"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"stm/config"
	"stm/oauth2"
	"stm/util"
)

var (
	supportedApiVersions = make([]string, 0)
)

func Init() error {
	// Register routes and print them
	router := mux.NewRouter()

	addInfoHandler(router)
	addDocHandler(router)

	addOAuth2LoginHandler(router)
	addOAuth2CallbackHandler(router)

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
	// (see doc/api for documentation of API changes)

	// API v2.8
	// TODO v2.8 is deprecated
	router_v2_8, version := Init_v2_8(router)
	supportedApiVersions = append(supportedApiVersions, version)
	sigolo.Info("Registered routes for API %s:", version)
	printRoutes(router_v2_8)

	router_v2_9, version := Init_v2_9(router)
	sigolo.Info("Registered routes for API %s:", version)
	printRoutes(router_v2_9)

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
// @Version 2.8
// @Tags info
// @Produce text/plain
// @Success 200 {string} string "Some bunch of text with basic information about this server"
// @Router /info [GET]
func addInfoHandler(router *mux.Router) {
	router.HandleFunc("/info", getInfo).Methods(http.MethodGet)
}

// API documentation
// @Summary A Swagger UI with all kinds of API related information.
// @Version 2.8
// @Tags info
// @Produce text/html
// @Router /doc [GET]
func addDocHandler(router *mux.Router) {
	router.HandleFunc("/doc", redirectDocHandler)
	router.PathPrefix("/doc").Handler(httpSwagger.WrapHandler)
}

func redirectDocHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/doc/index.html", 302)
}

// OAuth2 login
// @Description Redirects to the OSM Login page to start OSM login with OAuth2.
// @Version 2.8
// @Tags authentication
// @Router /oauth2/login [GET]
func addOAuth2LoginHandler(router *mux.Router) *mux.Route {
	return router.HandleFunc("/oauth2/login", oauth2.Login).Methods(http.MethodGet)
}

// OAuth2 callback
// @Description OAuth2 callback called after OSM login. Performs the OAuth authentication by getting an OSM access token.
// @Version 2.8
// @Tags authentication
// @Param state query string true "The state-string that was given to the OAuth service."
// @Param code query string true "The authentication code to retrieve the access token."
// @Router /oauth2/callback [GET]
func addOAuth2CallbackHandler(router *mux.Router) *mux.Route {
	return router.HandleFunc("/oauth2/callback", oauth2.Callback).Methods(http.MethodGet)
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
