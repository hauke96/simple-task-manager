package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/hauke96/simple-task-manager/server/websocket"
	"github.com/pkg/errors"
	"io/ioutil"
	"net/http"
)

type ProjectAddDto struct {
	Project project.ProjectDraftDto `json:"project"`
	Tasks   []task.TaskDraftDto  `json:"tasks"`
}

func Init_v2_6(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.6").Subrouter()

	r.HandleFunc("/projects", authenticatedTransactionHandler(getProjects_v2_6)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedTransactionHandler(addProject_v2_6)).Methods(http.MethodPost) // Edited in v2.5
	r.HandleFunc("/projects/{id}", authenticatedTransactionHandler(getProject_v2_6)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}", authenticatedTransactionHandler(deleteProjects_v2_6)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/name", authenticatedTransactionHandler(updateProjectName_v2_6)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/description", authenticatedTransactionHandler(updateProjectDescription_v2_6)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(addUserToProject_v2_6)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(leaveProject_v2_6)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users/{uid}", authenticatedTransactionHandler(removeUser_v2_6)).Methods(http.MethodDelete)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(assignUser_v2_6)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(unassignUser_v2_6)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedTransactionHandler(setProcessPoints_v2_6)).Methods(http.MethodPost)

	r.HandleFunc("/updates", authenticatedWebsocket(getWebsocketConnection))

	return r, "v2.6"
}

func getProjects_v2_6(r *http.Request, context *Context) *ApiResponse {
	projects, err := context.ProjectService.GetProjects(context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	context.Log("Successfully got projects")

	return JsonResponse(projects)
}

func addProject_v2_6(r *http.Request, context *Context) *ApiResponse {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "error reading request body"))
	}

	var dto ProjectAddDto
	err = json.Unmarshal(bodyBytes, &dto)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error unmarshalling project draft"))
	}

	addedProject, err := context.ProjectService.AddProjectWithTasks(&dto.Project, dto.Tasks)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error adding project with tasks"))
	}

	sendAdd(context.WebsocketSender, addedProject)

	context.Log("Successfully added project %s with %d tasks", addedProject.Id, len(dto.Tasks))

	return JsonResponse(addedProject)
}

func getProject_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	project, err := context.ProjectService.GetProject(projectId, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	context.Log("Successfully got project project %s", projectId)

	return JsonResponse(project)
}

func leaveProject_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	updatedProject, err := context.ProjectService.RemoveUser(projectId, context.Token.UID, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUserRemoved(context.WebsocketSender, updatedProject, context.Token.UID)

	context.Log("Successfully removed user '%s' from project %s (user left)", context.Token.UID, projectId)

	return EmptyResponse()
}

func removeUser_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	userToRemove, ok := vars["uid"]
	if !ok {
		return BadRequestError(errors.New("url segment 'uid' not set"))
	}

	updatedProject, err := context.ProjectService.RemoveUser(projectId, context.Token.UID, userToRemove)
	if err != nil {
		return InternalServerError(err)
	}

	sendUserRemoved(context.WebsocketSender, updatedProject, userToRemove)

	context.Log("Successfully removed user '%s' from project %s", userToRemove, projectId)

	return JsonResponse(updatedProject)
}

func deleteProjects_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	projectToDelete, err := context.ProjectService.GetProject(projectId, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	err = context.ProjectService.DeleteProject(projectId, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendDelete(context.WebsocketSender, projectToDelete)

	context.Log("Successfully removed project %s", projectId)

	return EmptyResponse()
}

func updateProjectName_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error reading request body"))
	}

	updatedProject, err := context.ProjectService.UpdateName(projectId, string(bodyBytes), context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUpdate(context.WebsocketSender, updatedProject)

	context.Log("Successfully updated name of project %s", projectId)

	return JsonResponse(updatedProject)
}

func updateProjectDescription_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error reading request body"))
	}

	updatedProject, err := context.ProjectService.UpdateDescription(projectId, string(bodyBytes), context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUpdate(context.WebsocketSender, updatedProject)

	context.Log("Successfully updated description of project %s", projectId)

	return JsonResponse(updatedProject)
}

func addUserToProject_v2_6(r *http.Request, context *Context) *ApiResponse {
	userToAdd, err := util.GetParam("uid", r)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "url param 'uid' not set"))
	}

	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	updatedProject, err := context.ProjectService.AddUser(projectId, userToAdd, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUpdate(context.WebsocketSender, updatedProject)

	context.Log("Successfully added user '%s' to project %s", userToAdd, projectId)

	return JsonResponse(updatedProject)
}

func assignUser_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	user := context.Token.UID

	task, err := context.TaskService.AssignUser(taskId, user)
	if err != nil {
		return InternalServerError(err)
	}

	// Send via websockets
	err = sendTaskUpdate(context.WebsocketSender, task, context)
	if err != nil {
		return InternalServerError(err)
	}

	context.Log("Successfully assigned user '%s' to task '%s'", user, taskId)

	return JsonResponse(*task)
}

func unassignUser_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	user := context.Token.UID

	task, err := context.TaskService.UnassignUser(taskId, user)
	if err != nil {
		return InternalServerError(err)
	}

	// Send via websockets
	err = sendTaskUpdate(context.WebsocketSender, task, context)
	if err != nil {
		return InternalServerError(err)
	}

	context.Log("Successfully unassigned user '%s' from task '%s'", user, taskId)

	return JsonResponse(*task)
}

func setProcessPoints_v2_6(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	processPoints, err := util.GetIntParam("process_points", r)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "url üarameter 'process_point' not set"))
	}

	task, err := context.TaskService.SetProcessPoints(taskId, processPoints, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	// Send via websockets
	err = sendTaskUpdate(context.WebsocketSender, task, context)
	if err != nil {
		return InternalServerError(err)
	}

	context.Log("Successfully set process points on task '%s' to %d", taskId, processPoints)

	return JsonResponse(*task)
}

func getWebsocketConnection(w http.ResponseWriter, r *http.Request, token *auth.Token, websocketSender *websocket.WebsocketSender) {
	websocketSender.GetWebsocketConnection(w, r, token.UID)
}

func sendAdd(sender *websocket.WebsocketSender, addedProject *project.Project) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectAdded,
		Id: addedProject.Id,
	}, addedProject.Users...)
}

func sendUpdate(sender *websocket.WebsocketSender, updatedProject *project.Project) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Id: updatedProject.Id,
	}, updatedProject.Users...)
}

func sendUserRemoved(sender *websocket.WebsocketSender, updatedProject *project.Project, removedUser string) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Id: updatedProject.Id,
	}, updatedProject.Users...)
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUserRemoved,
		Id: updatedProject.Id,
	}, removedUser)
}

func sendDelete(sender *websocket.WebsocketSender, removedProject *project.Project) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectDeleted,
		Id: removedProject.Id,
	}, removedProject.Users...)
}

func sendTaskUpdate(sender *websocket.WebsocketSender, task *task.Task, context *Context) error {
	project, err := context.ProjectService.GetProjectByTask(task.Id)
	if err != nil {
		return err
	}

	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Id: project.Id,
	}, project.Users...)

	return nil
}
