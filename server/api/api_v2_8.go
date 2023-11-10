package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/pkg/errors"
	"io/ioutil"
	"net/http"
	"stm/config"
	"stm/export"
	"stm/oauth2"
	"stm/project"
	"stm/task"
	"stm/util"
	"stm/websocket"
)

type ProjectAddDto struct {
	Project project.ProjectDraftDto `json:"project"`
	Tasks   []task.TaskDraftDto     `json:"tasks"`
}

func Init_v2_8(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.8").Subrouter()

	r.HandleFunc("/config", simpleHandler(getConfig_v2_8)).Methods(http.MethodGet)

	r.HandleFunc("/projects", authenticatedTransactionHandler(getProjects_v2_8)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedTransactionHandler(addProject_v2_8)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}", authenticatedTransactionHandler(getProject_v2_8)).Methods(http.MethodGet)
	r.HandleFunc("/projects/{id}", authenticatedTransactionHandler(deleteProjects_v2_8)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/export", authenticatedTransactionHandler(exportProject_v2_8)).Methods(http.MethodGet)
	r.HandleFunc("/projects/import", authenticatedTransactionHandler(importProject_v2_8)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}/name", authenticatedTransactionHandler(updateProjectName_v2_8)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/description", authenticatedTransactionHandler(updateProjectDescription_v2_8)).Methods(http.MethodPut)
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(addUserToProject_v2_8)).Methods(http.MethodPost)
	r.HandleFunc("/projects/{id}/users", authenticatedTransactionHandler(leaveProject_v2_8)).Methods(http.MethodDelete)
	r.HandleFunc("/projects/{id}/users/{uid}", authenticatedTransactionHandler(removeUser_v2_8)).Methods(http.MethodDelete)

	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(assignUser_v2_8)).Methods(http.MethodPost)
	r.HandleFunc("/tasks/{id}/assignedUser", authenticatedTransactionHandler(unassignUser_v2_8)).Methods(http.MethodDelete)
	r.HandleFunc("/tasks/{id}/processPoints", authenticatedTransactionHandler(setProcessPoints_v2_8)).Methods(http.MethodPost)

	r.HandleFunc("/updates", authenticatedWebsocket(getWebsocketConnection))

	return r, "v2.8"
}

// Get server configuration
// @Summary Gets the servers configuration containing important information for the client.
// @Version 2.8
// @Tags config
// @Produce json
// @Success 200 {object} config.ConfigDto
// @Router /v2.8/config [GET]
func getConfig_v2_8(_ *http.Request, _ *util.Logger) *ApiResponse {
	return JsonResponse(config.GetConfigDto())
}

// Get projects
// @Summary Get all projects for the requesting user.
// @Version 2.8
// @Tags projects
// @Produce json
// @Success 200 {object} []project.Project
// @Router /v2.8/projects [GET]
func getProjects_v2_8(r *http.Request, context *Context) *ApiResponse {
	projects, err := context.ProjectService.GetProjects(context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	context.Log("Successfully got projects")

	return JsonResponse(projects)
}

// Add projects
// @Summary Adds a new project.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param project body api.ProjectAddDto true "Draft project with draft task list"
// @Success 200 {object} project.Project
// @Router /v2.8/projects [POST]
func addProject_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Get project
// @Summary Get a specific project.
// @Description Gets a specific project. The requesting user must be a member of the project.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param project_id path string true "ID of the project to get"
// @Success 200 {object} project.Project
// @Router /v2.8/project/{id} [GET]
func getProject_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Leave project
// @Summary Removes the requesting user from project.
// @Description The requesting user must be a member (but not the owner) of the project will be removed.
// @Version 2.8
// @Tags projects
// @Param id path string true "ID of the project the requesting user should leave"
// @Router /v2.8/projects/{id}/users [DELETE]
func leaveProject_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Remove user
// @Summary Remove a user from a project.
// @Description Removes a user from the project. The requesting user must be the owner of the project and cannot be removed.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param id path string true "ID of the project the requesting user should leave"
// @Param uid path string true "OSM user-Id of the user who should be removed"
// @Success 200 {object} project.Project
// @Router /v2.8/projects/{id}/users/{uid} [DELETE]
func removeUser_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Delete project
// @Summary Delete a project.
// @Description Deletes the specified project. The requesting user must be the owner of the project.
// @Version 2.8
// @Tags projects
// @Param id path string true "ID of the project to delete"
// @Router /v2.8/projects/{id} [DELETE]
func deleteProjects_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Get a JSON representation of the project.
// @Summary Get a JSON representation of the project.
// @Description This aims to transfer a project to another STM instance or to simply create a backup of a project.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param id path string true "ID of the project"
// @Success 200 {object} project.Project
// @Router /v2.8/projects/{id}/export [GET]
func exportProject_v2_8(r *http.Request, context *Context) *ApiResponse {
	vars := mux.Vars(r)
	projectId, ok := vars["id"]
	if !ok {
		return BadRequestError(errors.New("url segment 'id' not set"))
	}

	projectExport, err := context.ExportService.ExportProject(projectId, context.Token.UID)
	if err != nil {
		return InternalServerError(err)
	}

	return JsonResponse(projectExport)
}

// Imports a previously exported project.
// @Summary Imports a previously exported project.
// @Description This aims to import a project from e.g. a backup or to migrate to another STM instance.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param projectExport body export.ProjectExport true "The project to import"
// @Router /v2.8/projects/import [POST]
func importProject_v2_8(r *http.Request, context *Context) *ApiResponse {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "error reading request body"))
	}

	var dto export.ProjectExport
	err = json.Unmarshal(bodyBytes, &dto)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error unmarshalling project export"))
	}

	addedProject, err := context.ExportService.ImportProject(&dto, context.Token.UID)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error importing project with tasks"))
	}

	sendAdd(context.WebsocketSender, addedProject)

	context.Log("Successfully imported project %s with %d tasks", addedProject.Id, len(dto.Tasks))

	return JsonResponse(addedProject)
}

// Update project name
// @Summary Update project name.
// @Description Updates the projects name/title. The requesting user must be the owner of the project.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param id path string true "ID of the project"
// @Param new_name body string true "The new name of the project"
// @Success 200 {object} project.Project
// @Router /v2.8/projects/{id}/name [PUT]
func updateProjectName_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Update project description
// @Summary Update project description.
// @Description Update the projects description. The requesting user must be the owner of the project.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param id path string true "ID of the project"
// @Param new_desc body string true "The new description of the project"
// @Success 200 {object} project.Project
// @Router /v2.8/projects/{id}/description [PUT]
func updateProjectDescription_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Add user
// @Summary Adds a user to the project
// @Description Adds the given user to the project. The requesting user must be the owner of the project.
// @Version 2.8
// @Tags projects
// @Produce json
// @Param id path string true "ID of the project"
// @Param uid query string true "The OSM user-ID to add to the project"
// @Success 200 {object} project.Project
// @Router /v2.8/projects/{id}/users [POST]
func addUserToProject_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Assign user
// @Summary Assigns a user to a task
// @Description Assigns the requesting user to the given task. The requesting user must be a member of the project.
// @Version 2.8
// @Tags tasks
// @Produce json
// @Param id path string true "The ID of the task"
// @Success 200 {object} task.Task
// @Router /v2.8/tasks/{id}/assignedUser [POST]
func assignUser_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Unassign user
// @Summary Unassigns a user from a task.
// @Description Unassigns the requesting user from the given task. The requesting user must be a member of the project and must be assigned to the given task.
// @Version 2.8
// @Tags tasks
// @Produce json
// @Param id path string true "The ID of the task"
// @Success 200 {object} task.Task
// @Router /v2.8/tasks/{id}/assignedUser [DELETE]
func unassignUser_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Set process points
// @Summary Sets the process points of a task.
// @Description Sets the process points of a task. The requesting user must be a member of the project. If the project has more than one member, the requesting user must be assigned to the given task.
// @Version 2.8
// @Tags tasks
// @Produce json
// @Param id path string true "The ID of the task"
// @Param process_points query int true "The new amount of process points of the task" minimum(0)
// @Success 200 {object} task.Task
// @Router /v2.8/tasks/{id}/processPoints [POST]
func setProcessPoints_v2_8(r *http.Request, context *Context) *ApiResponse {
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

// Establish websocket connection
// @Summary Established an websocket connection to receive updates on projects.
// @Description Established an websocket connection to receive updates on projects. This requires the same authentication as normal HTTP endpoints. See the GitHub repo '/doc/api' for information on the messaging protocol.
// @Version 2.8
// @Tags websocket
// @Success 200 {object} []project.Project
// @Router /v2.8/updates [GET]
func getWebsocketConnection(w http.ResponseWriter, r *http.Request, token *oauth2.Token, websocketSender *websocket.WebsocketSender) {
	websocketSender.GetWebsocketConnection(w, r, token.UID)
}

func sendAdd(sender *websocket.WebsocketSender, addedProject *project.Project) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectAdded,
		Id:   addedProject.Id,
	}, addedProject.Users...)
}

func sendUpdate(sender *websocket.WebsocketSender, updatedProject *project.Project) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Id:   updatedProject.Id,
	}, updatedProject.Users...)
}

func sendUserRemoved(sender *websocket.WebsocketSender, updatedProject *project.Project, removedUser string) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Id:   updatedProject.Id,
	}, updatedProject.Users...)
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUserRemoved,
		Id:   updatedProject.Id,
	}, removedUser)
}

func sendDelete(sender *websocket.WebsocketSender, removedProject *project.Project) {
	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectDeleted,
		Id:   removedProject.Id,
	}, removedProject.Users...)
}

func sendTaskUpdate(sender *websocket.WebsocketSender, task *task.Task, context *Context) error {
	project, err := context.ProjectService.GetProjectByTask(task.Id)
	if err != nil {
		return err
	}

	sender.Send(websocket.Message{
		Type: websocket.MessageType_ProjectUpdated,
		Id:   project.Id,
	}, project.Users...)

	return nil
}
