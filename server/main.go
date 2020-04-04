package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/hauke96/kingpin"
	"github.com/hauke96/sigolo"
)

const VERSION string = "0.4.0-dev"

var (
	app       = kingpin.New("Simple Task Manager", "A tool dividing an area of the map into smaller tasks.")
	appDebug  = app.Flag("debug", "Verbose mode, showing additional debug information").Short('d').Bool()
	appPort   = app.Flag("port", "The port to listen on. Default is 8080").Short('p').Default("8080").Int()
	appConfig = app.Flag("config", "The config file. CLI argument override the settings from that file.").Short('c').Default("./configs/default.json").String()
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
	sigolo.Info("Init simple-task-manager server v" + VERSION)

	configureCliArgs()
	_, err := app.Parse(os.Args[1:])
	sigolo.FatalCheck(err)
	configureLogging()

	// Load config an override with CLI args
	loadConfig(*appConfig)
	Conf.Port = *appPort
	Conf.DebugLogging = *appDebug

	// Register routes and print them
	router := mux.NewRouter()

	router.HandleFunc("/info", getInfo).Methods(http.MethodGet)
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

	sigolo.Info("Registered routes:")
	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()
		sigolo.Info("  %-*v %s", 7, methods, path)
		return nil
	})

	// Init of Config, Services, Storages, etc.
	InitProjects()
	InitTasks()
	InitAuth()
	sigolo.Info("Initializes services, storages, etc.")

	if strings.HasPrefix(Conf.ServerUrl, "https") {
		sigolo.Info("Use HTTPS? yes")
		err = http.ListenAndServeTLS(":"+strconv.Itoa(*appPort), Conf.SslCertFile, Conf.SslKeyFile, router)
	} else {
		sigolo.Info("Use HTTPS? no")
		err = http.ListenAndServe(":"+strconv.Itoa(*appPort), router)
	}
	sigolo.Info("Start serving ...")

	if err != nil {
		sigolo.Error(fmt.Sprintf("Error while serving: %s", err))
	}
}

func authenticatedHandler(handler func(w http.ResponseWriter, r *http.Request, token *Token)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		token, err := verifyRequest(r)
		if err != nil {
			sigolo.Error("Request is not authorized: %s", err.Error())
			// No further information to caller (which is a potential attacker)
			response(w, "Not authorized", http.StatusUnauthorized)
			return
		}

		handler(w, r, token)
	}
}

func getInfo(w http.ResponseWriter, r *http.Request) {
	fmtStr := "%-*s : %s\n"
	fmtColWidth := 10

	fmt.Fprintf(w, "Simple Task Manager Server\n")
	fmt.Fprintf(w, "==========================\n\n")
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Version", VERSION)
	fmt.Fprintf(w, fmtStr, fmtColWidth, "Code", "https://github.com/hauke96/simple-task-manager")
}

func getProjects(w http.ResponseWriter, r *http.Request, token *Token) {
	projects := GetProjects(token.User)

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

	updatedProject := AddProject(&project, token.User)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func getTasks(w http.ResponseWriter, r *http.Request, token *Token) {
	// Read task IDs from URL query parameter "task_ids" and split by ","
	taskIdsString, err := getParam("task_ids", r)
	if err != nil {
		responseBadRequest(w, err.Error())
		return
	}

	taskIds := strings.Split(taskIdsString, ",")

	userOwnsTasks := VerifyOwnership(token.User, taskIds)
	if !userOwnsTasks {
		sigolo.Error("At least one task belongs to a project where the user '%s' is not part of", token.User)
		response(w, "Not all tasks belong to user", http.StatusForbidden)
		return
	}

	tasks := GetTasks(taskIds)

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func addTask(w http.ResponseWriter, r *http.Request, token *Token) {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		sigolo.Error("Error reading request body: %s", err.Error())
		responseBadRequest(w, err.Error())
		return
	}

	var tasks []*Task
	json.Unmarshal(bodyBytes, &tasks)

	updatedTasks := AddTasks(tasks)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedTasks)
}

func assignUser(w http.ResponseWriter, r *http.Request, token *Token) {
	taskId, err := getParam("id", r)
	if err != nil {
		sigolo.Error(err.Error())
		responseBadRequest(w, err.Error())
		return
	}
	// TODO check wether task exists

	user := token.User

	task, err := AssignUser(taskId, user)
	if err != nil {
		sigolo.Error(err.Error())
		responseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser(w http.ResponseWriter, r *http.Request, token *Token) {
	taskId, err := getParam("id", r)
	if err != nil {
		sigolo.Error(err.Error())
		responseBadRequest(w, err.Error())
		return
	}
	// TODO check wether task exists

	user := token.User

	task, err := UnassignUser(taskId, user)
	if err != nil {
		sigolo.Error(err.Error())
		responseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints(w http.ResponseWriter, r *http.Request, token *Token) {
	taskId, err := getParam("id", r)
	if err != nil {
		sigolo.Error(err.Error())
		responseBadRequest(w, err.Error())
		return
	}

	processPoints, err := getIntParam("process_points", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		responseBadRequest(w, err.Error())
		return
	}

	task, err := SetProcessPoints(taskId, processPoints)
	if err != nil {
		sigolo.Error(err.Error())
		responseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully set process points on task '%s'", taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}
