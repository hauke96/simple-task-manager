package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/hauke96/simple-task-manager/server/websocket"
	"io/ioutil"
	"net/http"
)

func Init_v2_3(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.3").Subrouter()

	r.HandleFunc("/projects", authenticatedTransactionHandler(getProjects_v2_3)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedTransactionHandler(addProject_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}", authenticatedTransactionHandler(getProject_v2_3)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}", authenticatedTransactionHandler(deleteProjects_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/name", authenticatedTransactionHandler(updateProjectName_v2_3)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/description", authenticatedTransactionHandler(updateProjectDescription_v2_3)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(addUserToProject_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(leaveProject_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users/{uid}", authenticatedTransactionHandler(removeUser_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedTransactionHandler(getProjectTasks_v2_3)).Methods(http.MethodGet)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(assignUser_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(unassignUser_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedTransactionHandler(setProcessPoints_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/tasks", authenticatedTransactionHandler(addTask_v2_3)).Methods(http.MethodPost)

	r.HandleFunc("/updates", authenticatedWebsocket(getWebsocketConnection))

	return r, "v2.3"
}

func getProjects_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	projects, err := context.projectService.GetProjects(context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(projects)
}

func addProject_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	addedProject, err := context.projectService.AddProject(&draftProject)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendAdd(addedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(addedProject)
}

func getProject_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	project, err := context.projectService.GetProject(projectId, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(project)
}

func leaveProject_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	updatedProject, err := context.projectService.RemoveUser(projectId, context.token.UID, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUserRemoved(updatedProject, context.token.UID)
}

func removeUser_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	updatedProject, err := context.projectService.RemoveUser(projectId, context.token.UID, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUserRemoved(updatedProject, user)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func deleteProjects_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	projectToDelete, err := context.projectService.GetProject(projectId, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	err = context.projectService.DeleteProject(projectId, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendDelete(projectToDelete)
}

func updateProjectName_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	updatedProject, err := context.projectService.UpdateName(projectId, string(bodyBytes), context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func updateProjectDescription_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	updatedProject, err := context.projectService.UpdateDescription(projectId, string(bodyBytes), context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func getProjectTasks_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	tasks, err := context.projectService.GetTasks(projectId, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(tasks)
}

func addUserToProject_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	updatedProject, err := context.projectService.AddUser(projectId, userToAdd, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sendUpdate(updatedProject)

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedProject)
}

func assignUser_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	user := context.token.UID

	task, err := context.taskService.AssignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// Send via websockets
	if sendTaskUpdate(task, user, context) != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func unassignUser_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		util.ResponseBadRequest(w, "url segment 'id' not set")
		return
	}

	user := context.token.UID

	task, err := context.taskService.UnassignUser(taskId, user)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// Send via websockets
	if sendTaskUpdate(task, user, context) != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func setProcessPoints_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	task, err := context.taskService.SetProcessPoints(taskId, processPoints, context.token.UID)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	// Send via websockets
	if sendTaskUpdate(task, context.token.UID, context) != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	sigolo.Info("Successfully set process points on task '%s' to %d", taskId, processPoints)

	encoder := json.NewEncoder(w)
	encoder.Encode(*task)
}

func addTask_v2_3(w http.ResponseWriter, r *http.Request, context *Context) {
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

	updatedTasks, err := context.taskService.AddTasks(tasks)
	if err != nil {
		util.ResponseInternalError(w, err.Error())
		return
	}

	encoder := json.NewEncoder(w)
	encoder.Encode(updatedTasks)
}

func getWebsocketConnection(w http.ResponseWriter, r *http.Request, context *Context) {
	websocket.GetWebsocketConnection(w, r, context.token.UID)
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

func sendUserRemoved(updatedProject *project.Project, removedUser string) {
	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Data: updatedProject,
	}, updatedProject.Users...)
	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUserRemoved,
		Data: updatedProject.Id,
	}, removedUser)
}

func sendDelete(removedProject *project.Project) {
	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectDeleted,
		Data: removedProject.Id,
	}, removedProject.Users...)
}

func sendTaskUpdate(task *task.Task, userId string, context *Context) error {
	project, err := context.projectService.GetProjectByTask(task.Id, userId)
	if err != nil {
		return err
	}

	sigolo.Info("Send: %#v", project)

	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Data: project,
	}, project.Users...)

	return nil
}
