package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/util"
)

func Init_v2_1(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.1").Subrouter()

	r.HandleFunc("/projects/{id}", authenticatedHandler(getProject_v2_1)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}/users/{user}", authenticatedHandler(removeUser_v2_1)).Methods(http.MethodDelete)

	// Old from v2
	r.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v2)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v2)).Methods(http.MethodGet)
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
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	tasks, err := project.GetProject(projectId)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func removeUser_v2_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	user, ok := vars["user"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'user' not set")
		return
	}

	p, err := project.RemoveUser(projectId, token.User, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(p)
}
