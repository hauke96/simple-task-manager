package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
)

func Init_v1(router *mux.Router) (*mux.Router, string) {
	router_v1 := router.PathPrefix("/v1").Subrouter()

	router_v1.HandleFunc("/projects", authenticatedHandler(getProjects)).Methods(http.MethodGet)
	router_v1.HandleFunc("/projects", authenticatedHandler(addProject)).Methods(http.MethodPost)
	router_v1.HandleFunc("/projects/users", authenticatedHandler(addUserToProject)).Methods(http.MethodPost)
	router_v1.HandleFunc("/tasks", authenticatedHandler(getTasks)).Methods(http.MethodGet)
	router_v1.HandleFunc("/tasks", authenticatedHandler(addTask)).Methods(http.MethodPost)
	router_v1.HandleFunc("/task/assignedUser", authenticatedHandler(assignUser)).Methods(http.MethodPost)
	router_v1.HandleFunc("/task/assignedUser", authenticatedHandler(unassignUser)).Methods(http.MethodDelete)
	router_v1.HandleFunc("/task/processPoints", authenticatedHandler(setProcessPoints)).Methods(http.MethodPost)

	return router_v1, "v1"
}

func getProjects(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	projects, err := project.GetProjects(token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}

func addProject(w http.ResponseWriter, r *http.Request, token *auth.Token) {
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

	updatedProject, err := project.AddProject(&draftProject, token.User)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func addUserToProject(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	userName, err := util.GetParam("user", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	projectId, err := util.GetParam("project", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
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

func getTasks(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	// Read task IDs from URL query parameter "task_ids" and split by ","
	taskIdsString, err := util.GetParam("task_ids", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	taskIds := strings.Split(taskIdsString, ",")

	userOwnsTasks, err := project.VerifyOwnership(token.User, taskIds)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
	if !userOwnsTasks {
		sigolo.Error("At least one task belongs to a project where the user '%s' is not a member of", token.User)
		util.Response(w, "Not all tasks belong to user", http.StatusForbidden)
		return
	}

	tasks, err := task.GetTasks(taskIds)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func addTask(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		sigolo.Error("Error reading request body: %s", err.Error())
		util.ResponseBadRequest(w, err.Error())
		return
	}

	var tasks []*task.Task
	err = json.Unmarshal(bodyBytes, &tasks)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	updatedTasks, err := task.AddTasks(tasks)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedTasks)
}

func assignUser(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	taskId, err := util.GetParam("id", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
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

func unassignUser(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	taskId, err := util.GetParam("id", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
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

func setProcessPoints(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	taskId, err := util.GetParam("id", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	processPoints, err := util.GetIntParam("process_points", r)
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
