package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/hauke96/kingpin"
	"github.com/hauke96/sigolo"
)

const VERSION string = "0.3.0-dev"

var (
	app      = kingpin.New("Simple Task Manager", "A tool dividing an area of the map into smaller tasks.")
	appDebug = app.Flag("debug", "Verbose mode, showing additional debug information").Short('d').Bool()
	addPort  = app.Flag("port", "The port to listen on. Default is 8080").Short('p').Default("8080").Int()

	knownToken = make([]string, 0)
)

func configureCliArgs() {
	app.Author("Hauke Stieler")
	app.Version(VERSION)

	app.HelpFlag.Short('h')
	app.VersionFlag.Short('v')
}

func configureLogging() {
	if *appDebug {
		sigolo.LogLevel = sigolo.LOG_DEBUG
	} else {
		sigolo.LogLevel = sigolo.LOG_INFO
	}
}

func main() {
	configureCliArgs()
	_, err := app.Parse(os.Args[1:])
	sigolo.FatalCheck(err)
	configureLogging()

	// Some init logging
	sigolo.Info("Init simple-task-manager server version " + VERSION)
	sigolo.Info("Debug logging? %v", sigolo.LogLevel == sigolo.LOG_DEBUG)
	sigolo.Info("Use port %d", *addPort)

	// Register routes and print them
	router := mux.NewRouter()

	router.HandleFunc("/oauth_login", oauthLogin).Methods(http.MethodGet)
	router.HandleFunc("/oauth_callback", oauthCallback).Methods(http.MethodGet)
	router.HandleFunc("/projects", authenticatedHandler(getProjects)).Methods(http.MethodGet)
	router.HandleFunc("/projects", authenticatedHandler(addProject)).Methods(http.MethodPost)
	router.HandleFunc("/tasks", authenticatedHandler(getTasks)).Methods(http.MethodGet)

	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()
		sigolo.Info("Registered route: %s %v", path, methods)
		return nil
	})

	// Init Dummy-Data
	InitProjects()
	InitTasks()

	sigolo.Info("Registered all handler functions. Start serving...")

	// Start serving
	err = http.ListenAndServe(":"+strconv.Itoa(*addPort), router)
	if err != nil {
		sigolo.Error(fmt.Sprintf("Error while serving: %s", err))
	}
}

func authenticatedHandler(handler func(w http.ResponseWriter, r *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		err := verifyRequest(r)
		if err != nil {
			sigolo.Error("Request is not authorized: %s", err.Error())
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Request not authorized"))
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")

		handler(w, r)
	}
}

func verifyRequest(r *http.Request) error {
	encodedToken := r.FormValue("token")

	tokenBytes, err := base64.StdEncoding.DecodeString(encodedToken)
	if err != nil {
		sigolo.Error(err.Error())
		return err
	}

	var token Token
	json.Unmarshal(tokenBytes, &token)

	targetSecret, err := createSecret(token.User, token.ValidUntil)
	if err != nil {
		sigolo.Error(err.Error())
		return err
	}

	if token.Secret != targetSecret {
		return errors.New("Secret not valid")
	}

	if token.ValidUntil < time.Now().Unix() {
		return errors.New("Token expired")
	}

	sigolo.Info("User '%s' has valid token", token.User)

	return nil
}

func getParam(param string, w http.ResponseWriter, r *http.Request) (string, error) {
	value := r.FormValue(param)
	if strings.TrimSpace(value) == "" {
		errMsg := fmt.Sprintf("Parameter '%s' specified", param)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(errMsg))
		return "", errors.New(errMsg)
	}

	return value, nil
}

func getProjects(w http.ResponseWriter, r *http.Request) {
	sigolo.Info("Called get projects")

	projects := GetProjects()

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}

func addProject(w http.ResponseWriter, r *http.Request) {
	sigolo.Info("Called add project")

	name, err := getParam("name", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	taskIdsString, err := getParam("task_ids", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}
	taskIds := strings.Split(taskIdsString, ",")
	// TODO check wether tasks exist

	project := AddProject(name, taskIds)

	encoder := json.NewEncoder(w)
	encoder.Encode(project)
}

func getTasks(w http.ResponseWriter, r *http.Request) {
	sigolo.Info("Called get tasks")

	// Read task IDs from URL query parameter "task_ids" and split by ","
	taskIdsString, err := getParam("task_ids", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}
	taskIds := strings.Split(taskIdsString, ",")

	tasks := GetTasks(taskIds)

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}
