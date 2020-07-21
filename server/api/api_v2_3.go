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
	"github.com/pkg/errors"
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
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(addUserToProject_v2_3)).Methods(http.MethodPost) // projects/{id}/users?uid={uid}
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(leaveProject_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users/{uid}", authenticatedTransactionHandler(removeUser_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/tasks", authenticatedTransactionHandler(getProjectTasks_v2_3)).Methods(http.MethodGet)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(assignUser_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(unassignUser_v2_3)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedTransactionHandler(setProcessPoints_v2_3)).Methods(http.MethodPost)
	r.HandleFunc("/tasks", authenticatedTransactionHandler(addTasks_v2_3)).Methods(http.MethodPost)

	r.HandleFunc("/updates", authenticatedWebsocket(getWebsocketConnection))

	return r, "v2.3"
}

func getProjects_v2_3(r *http.Request, context *Context) *ApiResponse {
	projects, err := context.projectService.GetProjects(context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully got projects")

	return JsonResponse(projects)
}

func addProject_v2_3(r *http.Request, context *Context) *ApiResponse {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "error reading request body"))
	}

	var draftProject project.Project
	err = json.Unmarshal(bodyBytes, &draftProject)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error unmarshalling project draft"))
	}

	addedProject, err := context.projectService.AddProject(&draftProject)
	if err != nil {
		return InternalServerError(err)
	}

	sendAdd(addedProject)

	sigolo.Info("Successfully added project %s", addedProject.Id)

	return JsonResponse(addedProject)
}

func getProject_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	project, err := context.projectService.GetProject(projectId, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully got project project %s", projectId)

	return JsonResponse(project)
}

func leaveProject_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	updatedProject, err := context.projectService.RemoveUser(projectId, context.token.UID, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUserRemoved(updatedProject, context.token.UID)

	sigolo.Info("Successfully removed user '%s' from project %s (user left)", context.token.UID, projectId)

	return EmptyResponse()
}

func removeUser_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	userToRemove, ok := vars["uid"]
	if !ok {
		return BadRequestError(errors.New("url segment 'uid' not set"))
	}

	updatedProject, err := context.projectService.RemoveUser(projectId, context.token.UID, userToRemove)
	if err != nil {
		return InternalServerError(err)
	}

	sendUserRemoved(updatedProject, userToRemove)

	sigolo.Info("Successfully removed user '%s' from project %s", userToRemove, projectId)

	return JsonResponse(updatedProject)
}

func deleteProjects_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	projectToDelete, err := context.projectService.GetProject(projectId, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	err = context.projectService.DeleteProject(projectId, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendDelete(projectToDelete)

	sigolo.Info("Successfully removed project %s", projectId)

	return EmptyResponse()
}

func updateProjectName_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error reading request body"))
	}

	updatedProject, err := context.projectService.UpdateName(projectId, string(bodyBytes), context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUpdate(updatedProject)

	sigolo.Info("Successfully updated name of project %s", projectId)

	return JsonResponse(updatedProject)
}

func updateProjectDescription_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error reading request body"))
	}

	updatedProject, err := context.projectService.UpdateDescription(projectId, string(bodyBytes), context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUpdate(updatedProject)

	sigolo.Info("Successfully updated description of project %s", projectId)

	return JsonResponse(updatedProject)
}

func getProjectTasks_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	tasks, err := context.projectService.GetTasks(projectId, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully got tasks of project %s", projectId)

	return JsonResponse(tasks)
}

func addUserToProject_v2_3(r *http.Request, context *Context) *ApiResponse {
	userToAdd, err := util.GetParam("uid", r)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "url param 'uid' not set"))
	}

	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	updatedProject, err := context.projectService.AddUser(projectId, userToAdd, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	sendUpdate(updatedProject)

	sigolo.Info("Successfully added user '%s' to project %s", userToAdd, projectId)

	return JsonResponse(updatedProject)
}

func assignUser_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	user := context.token.UID

	task, err := context.taskService.AssignUser(taskId, user)
	if err != nil {
		return InternalServerError(err)
	}

	// Send via websockets
	err = sendTaskUpdate(task, user, context)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully assigned user '%s' to task '%s'", user, taskId)

	return JsonResponse(*task)
}

func unassignUser_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	user := context.token.UID

	task, err := context.taskService.UnassignUser(taskId, user)
	if err != nil {
		return InternalServerError(err)
	}

	// Send via websockets
	err = sendTaskUpdate(task, user, context)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully unassigned user '%s' from task '%s'", user, taskId)

	return JsonResponse(*task)
}

func setProcessPoints_v2_3(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	taskId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	processPoints, err := util.GetIntParam("process_points", r)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "url üarameter 'process_point' not set"))
	}

	task, err := context.taskService.SetProcessPoints(taskId, processPoints, context.token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	// Send via websockets
	err = sendTaskUpdate(task, context.token.UID, context)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully set process points on task '%s' to %d", taskId, processPoints)

	return JsonResponse(*task)
}

func addTasks_v2_3(r *http.Request, context *Context) *ApiResponse {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "error reading request body"))
	}

	var tasks []*task.Task
	err = json.Unmarshal(bodyBytes, &tasks)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error unmarshalling task"))
	}

	// TODO check for correct GeoJson format

	updatedTasks, err := context.taskService.AddTasks(tasks)
	if err != nil {
		return InternalServerError(err)
	}

	sigolo.Info("Successfully added tasks")

	return JsonResponse(updatedTasks)
}

func getWebsocketConnection(w http.ResponseWriter, r *http.Request, token *auth.Token) {
	websocket.GetWebsocketConnection(w, r, token.UID)
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

	websocket.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Data: project,
	}, project.Users...)

	return nil
}
