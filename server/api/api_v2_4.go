package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/pkg/errors"
	"io/ioutil"
	"net/http"
)

type ProjectAddDto struct {
	Project project.Project `json:"project"`
	Tasks []*task.Task `json:"tasks"`
}

func Init_v2_4(router *mux.Router) (*mux.Router, string) {
	r := router.PathPrefix("/v2.4").Subrouter()

	r.HandleFunc("/projects", authenticatedTransactionHandler(getProjects_v2_3)).Methods(http.MethodGet)
	r.HandleFunc("/projects", authenticatedTransactionHandler(addProject_v2_4)).Methods(http.MethodPost) // NEW
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
	//r.HandleFunc("/tasks", authenticatedTransactionHandler(addTasks_v2_3)).Methods(http.MethodPost)

	r.HandleFunc("/updates", authenticatedWebsocket(getWebsocketConnection))

	return r, "v2.4"
}

func addProject_v2_4(r *http.Request, context *Context) *ApiResponse {
	bodyBytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return BadRequestError(errors.Wrap(err, "error reading request body"))
	}

	var dto ProjectAddDto
	err = json.Unmarshal(bodyBytes, &dto)
	if err != nil {
		return InternalServerError(errors.Wrap(err, "error unmarshalling project draft"))
	}

	//
	// Store project
	//

	addedProject, err := context.projectService.AddProject(&dto.Project)
	if err != nil {
		return InternalServerError(err)
	}
	sigolo.Info("Successfully added project %s", addedProject.Id)

	// TODO check for correct GeoJson format in task geometries

	//
	// Store tasks
	//

	_, err = context.taskService.AddTasks(dto.Tasks)
	if err != nil {
		return InternalServerError(err)
	}
	sigolo.Info("Successfully added tasks")

	sendAdd(addedProject)

	return JsonResponse(addedProject)
}