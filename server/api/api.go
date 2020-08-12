package api

import (
	"fmt"
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

	router.HandleFunc("/info", getInfo).Methods(http.MethodGet)
	router.HandleFunc("/oauth_login", auth.OauthLogin).Methods(http.MethodGet)
	router.HandleFunc("/oauth_callback", auth.OauthCallback).Methods(http.MethodGet)

	sigolo.Info("Registered general routes:")
	printRoutes(router)

	// Not supported anymore:
	// API v1
	// API v2
	// API v2.1
	// API v2.2

	// API v2.3
	router_v2_3, version := Init_v2_3(router)
	supportedApiVersions = append(supportedApiVersions, version)
	sigolo.Info("Registered routes for API %s:", version)
	printRoutes(router_v2_3)

	// API v2.4
	router_v2_4, version := Init_v2_4(router)
	supportedApiVersions = append(supportedApiVersions, version)
	sigolo.Info("Registered routes for API %s:", version)
	printRoutes(router_v2_4)

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

func getInfo(w http.ResponseWriter, r *http.Request) {
	fmtStr := "%*s : %s\n"
	fmtColWidth := 22

	fmt.Fprintf(w, "SimpleTaskManager Server:\n")
	fmt.Fprintf(w, "=========================\n\n")
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Version", util.VERSION)
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Code", "https://github.com/hauke96/simple-task-manager")
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Supported API versions", strings.Join(supportedApiVersions, ", "))
}
