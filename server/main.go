package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
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
	router.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)
	router.HandleFunc("/task/assignedUser", authenticatedHandler(assignUser)).Methods(http.MethodPost)
	router.HandleFunc("/task/assignedUser", authenticatedHandler(unassignUser)).Methods(http.MethodDelete)
	router.HandleFunc("/task/processPoints", authenticatedHandler(setProcessPoints)).Methods(http.MethodPost)

	router.Methods(http.MethodOptions).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,DELETE")
		w.Header().Set("Access-Control-Allow-Request-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Request-Methods", "GET,POST,DELETE")
	})

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

func authenticatedHandler(handler func(w http.ResponseWriter, r *http.Request, token *Token)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := verifyRequest(r)
		if err != nil {
			sigolo.Error("Request is not authorized: %s", err.Error())
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Request not authorized"))
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")

		handler(w, r, token)
	}
}

// verifyRequest checks the integrity of the token and the "valiUntil" date. It
// then returns the token but without the secret part, just the metainformation
// (e.g. user name) is set.
func verifyRequest(r *http.Request) (*Token, error) {
	encodedToken := r.FormValue("token")

	tokenBytes, err := base64.StdEncoding.DecodeString(encodedToken)
	if err != nil {
		sigolo.Error(err.Error())
		return nil, err
	}

	var token Token
	json.Unmarshal(tokenBytes, &token)

	targetSecret, err := createSecret(token.User, token.ValidUntil)
	if err != nil {
		sigolo.Error(err.Error())
		return nil, err
	}

	if token.Secret != targetSecret {
		return nil, errors.New("Secret not valid")
	}

	if token.ValidUntil < time.Now().Unix() {
		return nil, errors.New("Token expired")
	}

	sigolo.Debug("User '%s' has valid token", token.User)
	sigolo.Info("User '%s' called %s", token.User, r.URL.Path)

	token.Secret = ""
	return &token, nil
}

func getParam(param string, w http.ResponseWriter, r *http.Request) (string, error) {
	value := r.FormValue(param)
	if strings.TrimSpace(value) == "" {
		errMsg := fmt.Sprintf("Parameter '%s' not specified", param)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(errMsg))
		return "", errors.New(errMsg)
	}

	return value, nil
}

func getIntParam(param string, w http.ResponseWriter, r *http.Request) (int, error) {
	valueString, err := getParam(param, w, r)
	if err != nil {
		return 0, err
	}

	return strconv.Atoi(valueString)
}

func getProjects(w http.ResponseWriter, r *http.Request, token *Token) {
	projects := GetProjects()

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}

func addProject(w http.ResponseWriter, r *http.Request, token *Token) {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		sigolo.Error("Error reading request body: %s", err.Error())
		return
	}

	var project Project
	json.Unmarshal(bodyBytes, &project)
	// TODO check wether all neccessary fields are set

	project = AddProject(project)

	encoder := json.NewEncoder(w)
	encoder.Encode(project)
}

func getTasks(w http.ResponseWriter, r *http.Request, token *Token) {
	// Read task IDs from URL query parameter "task_ids" and split by ","
	taskIdsString, err := getParam("task_ids", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}
	taskIds := strings.Split(taskIdsString, ",")
	// TODO check wether task exists

	tasks := GetTasks(taskIds)

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func addTask(w http.ResponseWriter, r *http.Request, token *Token) {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		sigolo.Error("Error reading request body: %s", err.Error())
		return
	}

	var tasks []*Task
	json.Unmarshal(bodyBytes, &tasks)

	updatedTasks := AddTasks(tasks)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedTasks)
}

func assignUser(w http.ResponseWriter, r *http.Request, token *Token) {
	taskId, err := getParam("id", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}
	// TODO check wether task exists

	user := token.User
	// TODO check wether login-user is the same as the user that should be assigned. If not -> error

	task, err := AssignUser(taskId, user)
	if err != nil {
		sigolo.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser(w http.ResponseWriter, r *http.Request, token *Token) {
	taskId, err := getParam("id", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}
	// TODO check wether task exists

	user := token.User
	// TODO check wether login-user is the same as the user that should be assigned. If not -> error

	task, err := UnassignUser(taskId, user)
	if err != nil {
		sigolo.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints(w http.ResponseWriter, r *http.Request, token *Token) {
	taskId, err := getParam("id", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	processPoints, err := getIntParam("process_points", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		return
	}

	task, err := SetProcessPoints(taskId, processPoints)
	if err != nil {
		sigolo.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	sigolo.Info("Successfully set process points on task '%s'", taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}
