package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"

	"../auth"
	"../project"
	"../util"
)

func Init_v2_1(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.1").Subrouter()

	r.HandleFunc("/projects/{id}", authenticatedHandler(getProject_v2_1)).Methods(http.MethodGet)

	// Old from v2
	r.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v2)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v2)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}/users", authenticatedHandler(leaveProject_v2)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users", authenticatedHandler(addUserToProject_v2)).Methods(http.MethodPost)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(assignUser_v2)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(unassignUser_v2)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedHandler(setProcessPoints_v2)).Methods(http.MethodPost)

	// Same as in v1:
	r.HandleFunc("/projects", authenticatedHandler(getProjects)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedHandler(addProject)).Methods(http.MethodPost)
	r.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)

	return r, "v2.1"
}

func getProject_v2_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	tasks, err := project.GetProject(vars["id"])
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}