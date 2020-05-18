package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"io/ioutil"
	"net/http"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/util"
)

func Init_v2_2(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.2").Subrouter()

	r.HandleFunc("/projects", authenticatedHandler(getProjects_v2_2)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedHandler(addProject_v2_2)).Methods(http.MethodPost)

	// Old from v2.1
	r.HandleFunc("/projects/{id}", authenticatedHandler(getProject_v2_1)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}/users/{user}", authenticatedHandler(removeUser_v2_1)).Methods(http.MethodDelete)

	// Old from v2
	r.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v2)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v2)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}/users", authenticatedHandler(addUserToProject_v2)).Methods(http.MethodPost)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(assignUser_v2)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(unassignUser_v2)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedHandler(setProcessPoints_v2)).Methods(http.MethodPost)

	// Old from v1
	r.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)

	return r, "v2.2"
}

func getProjects_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	projects, err := project.GetProjects(token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}

func addProject_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	var draftProject project.Project
	err = json.Unmarshal(bodyBytes, &draftProject)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	updatedProject, err := project.AddProject(&draftProject, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}