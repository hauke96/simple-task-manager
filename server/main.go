package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/hauke96/kingpin"
	"github.com/hauke96/sigolo"
)

const VERSION string = "v0.0.1"

var (
	app      = kingpin.New("Simple Task Manager", "A tool dividing an area of the map into smaller tasks.")
	appDebug = app.Flag("debug", "Verbose mode, showing additional debug information").Short('d').Bool()
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

	router := mux.NewRouter()
	router.HandleFunc("/projects", getProjects).Methods(http.MethodGet)

	sigolo.Info("Registered handler functions. Start serving...")

	err = http.ListenAndServe(":8080", router)
	if err != nil {
		sigolo.Error(fmt.Sprintf("Error while serving: %s", err))
	}
}

func getProjects(w http.ResponseWriter, r *http.Request) {
	sigolo.Info("Called get projects")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	projects := make([]Project, 0)
	projects = append(projects, Project{
		Id:      "p-1",
		Name:    "First project",
		TaskIDs: []string{"t0", "t1"},
	})
	projects = append(projects, Project{
		Id:      "p-2",
		Name:    "Foo",
		TaskIDs: []string{"t2"},
	})
	projects = append(projects, Project{
		Id:      "p-3",
		Name:    "Bar",
		TaskIDs: []string{"t3", "t4"},
	})

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}
