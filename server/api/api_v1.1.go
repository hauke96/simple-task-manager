package api

import (
	"../auth"
	"../project"
	"../util"
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"
)

func Init_V1_1(router *mux.Router) (*mux.Router, string) {
	routerV1 := router.PathPrefix("/v1.1").Subrouter()

	routerV1.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects)).Methods(http.MethodDelete)
	routerV1.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks)).Methods(http.MethodGet)
	routerV1.HandleFunc("/projects/{id}/users", authenticatedHandler(leaveProject)).Methods(http.MethodDelete)

	// Same as in v1:
	routerV1.HandleFunc("/projects", authenticatedHandler(getProjects)).Methods(http.MethodGet)
	routerV1.HandleFunc("/projects", authenticatedHandler(addProject)).Methods(http.MethodPost)
	routerV1.HandleFunc("/projects/users", authenticatedHandler(addUserToProject)).Methods(http.MethodPost)
	routerV1.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)
	routerV1.HandleFunc("/task/assignedUser", authenticatedHandler(assignUser)).Methods(http.MethodPost)
	routerV1.HandleFunc("/task/assignedUser", authenticatedHandler(unassignUser)).Methods(http.MethodDelete)
	routerV1.HandleFunc("/task/processPoints", authenticatedHandler(setProcessPoints)).Methods(http.MethodPost)

	return routerV1, "v1"
}

func deleteProjects(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	err := project.DeleteProject(vars["id"], token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}

func getProjectTasks(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	tasks, err := project.GetTasks(vars["id"], token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func leaveProject(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	_, err := project.LeaveProject(vars["id"], token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}