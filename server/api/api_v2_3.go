package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/hauke96/simple-task-manager/server/websocket"
	"io/ioutil"
	"net/http"
)

func Init_v2_3(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.3").Subrouter()

	r.HandleFunc("/projects", authenticatedHandler(getProjects_v2_3)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedHandler(addProject_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}", authenticatedHandler(getProject_v2_3)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}", authenticatedHandler(deleteProjects_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/name", authenticatedHandler(updateProjectName_v2_3)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/description", authenticatedHandler(updateProjectDescription_v2_3)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/users", authenticatedHandler(addUserToProject_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}/users", authenticatedHandler(leaveProject_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users/{uid}", authenticatedHandler(removeUser_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedHandler(getProjectTasks_v2_3)).Methods(http.MethodGet)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(assignUser_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedHandler(unassignUser_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedHandler(setProcessPoints_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/tasks", authenticatedHandler(addTask_v2_3)).Methods(http.MethodPost)

	r.HandleFunc("/updates", authenticatedWebsocket(websocket.GetWebsocketConnection))

	return r, "v2.3"
}

func getProjects_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	projects, err := project.GetProjects(token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}

func addProject_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
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

	addedProject, err := project.AddProject(&draftProject)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendAdd(addedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(addedProject)
}

func getProject_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
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

func leaveProject_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	updatedProject, err := project.RemoveUser(projectId, token.UID, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)
}

func removeUser_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	user, ok := vars["uid"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'user' not set")
		return
	}

	updatedProject, err := project.RemoveUser(projectId, token.UID, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func deleteProjects_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	projectToDelete, err := project.GetProject(projectId, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	err = project.DeleteProject(projectId, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendDelete(projectToDelete)
}

func updateProjectName_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		sigolo.Error("Error reading request body: %s", err.Error())
		util.ResponseBadRequest(w, err.Error())
		return
	}

	updatedProject, err := project.UpdateName(projectId,string(bodyBytes), token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func updateProjectDescription_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		sigolo.Error("Error reading request body: %s", err.Error())
		util.ResponseBadRequest(w, err.Error())
		return
	}

	updatedProject, err := project.UpdateDescription(projectId, string(bodyBytes), token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func getProjectTasks_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
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

func addUserToProject_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	userToAdd, err := util.GetParam("uid", r)
	if err != nil {
		util.ResponseBadRequest(w, err.Error())
		return
	}

	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	updatedProject, err := project.AddUser(projectId, userToAdd, token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func assignUser_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	user := token.UID

	task, err := task.AssignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// Send via websockets
	if sendTaskUpdate(task, user) != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	user := token.UID

	task, err := task.UnassignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// Send via websockets
	if sendTaskUpdate(task, user) != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
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

	// Send via websockets
	if sendTaskUpdate(task, token.UID) != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully set process points on task '%s' to %d", taskId, processPoints)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func addTask_v2_3(w http.ResponseWriter, r *http.Request, token *auth.Token) {
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

	// TODO check for correct GeoJson format

	updatedTasks, err := task.AddTasks(tasks)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedTasks)
}

func sendAdd(addedProject *project.Project) {
	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectAdded,
		Data: addedProject,
	}, addedProject.Users...)
}

func sendUpdate(updatedProject *project.Project) {
	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Data: updatedProject,
	}, updatedProject.Users...)
}

func sendDelete(removedProject *project.Project) {
	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectDeleted,
		Data: removedProject.Id,
	}, removedProject.Users...)
}

func sendTaskUpdate(task *task.Task, userId string) error {
	project, err := project.GetProjectByTask(task.Id, userId)
	if err != nil {
		return err
	}

	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Data: project,
	}, project.Users...)

	return nil
}