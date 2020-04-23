package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"net/http"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
)

func Init_v2(router *mux.Router) (*mux.Router, string) {
	router_v2 := router.PathPrefix("/v2").Subrouter()

	router_v2.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v2)).Methods(http.MethodDelete)
	router_v2.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v2)).Methods(http.MethodGet)
	router_v2.HandleFunc("/projects/{id}/users", authenticatedHandler(leaveProject_v2)).Methods(http.MethodDelete)
	router_v2.HandleFunc("/projects/{id}/users", authenticatedHandler(addUserToProject_v2)).Methods(http.MethodPost)

	router_v2.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(assignUser_v2)).Methods(http.MethodPost)
	router_v2.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(unassignUser_v2)).Methods(http.MethodDelete)
	router_v2.HandleFunc("/tasks/{id}/processPoints", authenticatedHandler(setProcessPoints_v2)).Methods(http.MethodPost)

	// Same as in v1:
	router_v2.HandleFunc("/projects", authenticatedHandler(getProjects)).Methods(http.MethodGet)
	router_v2.HandleFunc("/projects", authenticatedHandler(addProject)).Methods(http.MethodPost)
	router_v2.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)

	return router_v2, "v2"
}

func deleteProjects_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	err := project.DeleteProject(projectId, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}

func getProjectTasks_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	tasks, err := project.GetTasks(projectId, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func leaveProject_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	_, err := project.LeaveProject(projectId, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}

func addUserToProject_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	userName, err := util.GetParam("user", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	updatedProject, err := project.AddUser(userName, projectId, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func assignUser_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	user := token.User

	task, err := task.AssignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	user := token.User

	task, err := task.UnassignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints_v2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	processPoints, err := util.GetIntParam("process_points", w, r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	task, err := task.SetProcessPoints(taskId, processPoints, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully set process points on task '%s' to %d", taskId, processPoints)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}
