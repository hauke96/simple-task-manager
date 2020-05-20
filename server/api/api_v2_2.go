package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/task"
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
	r.HandleFunc("/projects/{id}", authenticatedHandler(getProject_v2_2)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v2_2)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users", authenticatedHandler(addUserToProject_v2_2)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}/users/{uid}", authenticatedHandler(removeUser_v2_2)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v2_2)).Methods(http.MethodGet)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(assignUser_v2_2)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(unassignUser_v2_2)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedHandler(setProcessPoints_v2_2)).Methods(http.MethodPost)
	r.HandleFunc("/tasks", authenticatedHandler(addTask_v2_2)).Methods(http.MethodPost)

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

	updatedProject, err := project.AddProject(&draftProject)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func getProject_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	project, err := project.GetProject(projectId, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(project)
}

func removeUser_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	user, ok := vars["uid"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'user' not set")
		return
	}

	p, err := project.RemoveUser(projectId, token.UID, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(p)
}

func deleteProjects_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	err := project.DeleteProject(projectId, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}
}

func getProjectTasks_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	tasks, err := project.GetTasks(projectId, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func addUserToProject_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	userToAdd, err := util.GetParam("uid", r)
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

	updatedProject, err := project.AddUser(projectId, userToAdd, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func assignUser_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	user := token.UID

	task, err := task.AssignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	user := token.UID

	task, err := task.UnassignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "query parameter 'id' not set")
		return
	}

	processPoints, err := util.GetIntParam("process_points", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	task, err := task.SetProcessPoints(taskId, processPoints, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully set process points on task '%s' to %d", taskId, processPoints)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func addTask_v2_2(w http.ResponseWriter, r *http.Request, token *auth.Token) {
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