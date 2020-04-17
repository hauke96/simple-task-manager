package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"net/http"

	"../auth"
	"../project"
	"../task"
	"../util"
)

func Init_V1_1(router *mux.Router) (*mux.Router, string) {
	routerV1 := router.PathPrefix("/v1.1").Subrouter()

	routerV1.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v1_1)).Methods(http.MethodDelete)
	routerV1.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v1_1)).Methods(http.MethodGet)
	routerV1.HandleFunc("/projects/{id}/users", authenticatedHandler(leaveProject_v1_1)).Methods(http.MethodDelete)
	routerV1.HandleFunc("/projects/{id}/users", authenticatedHandler(addUserToProject_v1_1)).Methods(http.MethodPost)

	routerV1.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(assignUser_v1_1)).Methods(http.MethodPost)
	routerV1.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(unassignUser_v1_1)).Methods(http.MethodDelete)
	routerV1.HandleFunc("/tasks/{id}/processPoints", authenticatedHandler(setProcessPoints_v1_1)).Methods(http.MethodPost)

	// Same as in v1:
	routerV1.HandleFunc("/projects", authenticatedHandler(getProjects)).Methods(http.MethodGet)
	routerV1.HandleFunc("/projects", authenticatedHandler(addProject)).Methods(http.MethodPost)
	routerV1.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)

	return routerV1, "v1.1"
}

func deleteProjects_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	err := project.DeleteProject(vars["id"], token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}

func getProjectTasks_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	tasks, err := project.GetTasks(vars["id"], token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func leaveProject_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)

	_, err := project.LeaveProject(vars["id"], token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}

func addUserToProject_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	userName, err := util.GetParam("user", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	vars := mux.Vars(r)
	projectId := vars["id"]

	updatedProject, err := project.AddUser(userName, projectId, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func assignUser_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId := vars["id"]

	user := token.User

	task, err := task.AssignUser(taskId, user)
	if err != nil {
		sigolo.Error(err.Error())
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId := vars["id"]

	user := token.User

	task, err := task.UnassignUser(taskId, user)
	if err != nil {
		sigolo.Error(err.Error())
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints_v1_1(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId := vars["id"]

	processPoints, err := util.GetIntParam("process_points", w, r)
	if err != nil {
		sigolo.Error(err.Error())
		util.ResponseBadRequest(w, err.Error())
		return
	}

	task, err := task.SetProcessPoints(taskId, processPoints)
	if err != nil {
		sigolo.Error(err.Error())
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully set process points on task '%s' to %d", taskId, processPoints)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}
