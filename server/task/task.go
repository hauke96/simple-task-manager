package task

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/util"
	geojson "github.com/paulmach/go.geojson"
	"github.com/pkg/errors"
	"strings"
)

type TaskDraftDto struct {
	MaxProcessPoints int    `json:"maxProcessPoints"` // The maximum amount of process points of this task. Must be larger than zero.
	ProcessPoints    int    `json:"processPoints"`    // The amount of process points that have been set by the user. It applies that "0 <= processPoints <= maxProcessPoints".
	Geometry         string `json:"geometry"`         // A GeoJson feature with a polygon or multi-polygon geometry. If the feature properties contain the field "name", then this will be used as the name of the task.
}

type Task struct {
	Id               string `json:"id"`               // The ID of the task.
	Name             string `json:"name"`             // The name of the task. If the properties of the geometry feature contain the field "name", this field is used here. If no name has been set, this field will be empty.
	ProcessPoints    int    `json:"processPoints"`    // The amount of process points that have been set by the user. It applies that "0 <= processPoints <= maxProcessPoints".
	MaxProcessPoints int    `json:"maxProcessPoints"` // The maximum amount of process points of this task. Is larger than zero.
	Geometry         string `json:"geometry"`         // A GeoJson feature of the task wit a polygon or multipolygon geometry. Will never be NULL or empty.
	AssignedUser     string `json:"assignedUser"`     // The user-ID of the user who is currently assigned to this task. Will never be NULL but might be empty.
}

type TaskService struct {
	*util.Logger
	store             *StorePg
	permissionService *permission.PermissionService
}

func Init(tx *sql.Tx, logger *util.Logger, permissionService *permission.PermissionService) *TaskService {
	return &TaskService{
		Logger:            logger,
		store:             GetStore(tx, logger),
		permissionService: permissionService,
	}
}

// Simply gets the tasks for the given project
func (s *TaskService) GetTasks(projectId string) ([]*Task, error) {
	return s.store.GetAllTasksOfProject(projectId)
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func (s *TaskService) AddTasks(newTasks []TaskDraftDto, projectId string) ([]*Task, error) {
	for _, t := range newTasks {
		if t.MaxProcessPoints < 1 {
			return nil, errors.New(fmt.Sprintf("Maximum process points must be at least 1 (%d)", t.MaxProcessPoints))
		}

		// Check for valid geojson
		feature, err := geojson.UnmarshalFeature([]byte(t.Geometry))
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("invalid GeoJSON: %s", t.Geometry))
		}

		if feature.Type != "Feature" || feature.Geometry == nil {
			s.Err("Invalid feature found: %#v", feature)
			return nil, errors.New(fmt.Sprintf("task geometry is null, not a feature or doesn't contain a polygon: %s", t.Geometry))
		}

		if !(feature.Geometry.Type == geojson.GeometryPolygon || feature.Geometry.Type == geojson.GeometryMultiPolygon) {
			s.Err("Invalid geometry type found: %#v", feature)
			return nil, errors.New(fmt.Sprintf("task geometry has invalid type: %s. Only \"%s\" and \"%s\" allowed", t.Geometry, geojson.GeometryPolygon, geojson.GeometryMultiPolygon))
		}

		// Delete id property to not be confused with the id of the task
		delete(feature.Properties, "id")
	}

	tasks, err := s.store.addTasks(newTasks, projectId)
	if err != nil {
		return nil, err
	}
	s.Log("Added all %d tasks to project %s", len(tasks), projectId)
	s.Debug("Added task IDs: %v", toTaskIds(tasks))

	return tasks, nil
}

func toTaskIds(tasks []*Task) []string {
	ids := make([]string, len(tasks))
	for i, v := range tasks {
		ids[i] = v.Id
	}
	return ids
}

func (s *TaskService) AssignUser(taskId, userId string) (*Task, error) {
	task, err := s.store.getTask(taskId)
	if err != nil {
		return nil, err
	}

	// Task has already an assigned user
	if strings.TrimSpace(task.AssignedUser) != "" {
		return nil, errors.New(fmt.Sprintf("task %s has already an assigned userId, cannot overwrite", task.Id))
	}

	task, err = s.store.assignUser(taskId, userId)
	if err != nil {
		return nil, err
	}
	s.Log("Assigned user %s from task %s", userId, taskId)

	return task, nil
}

func (s *TaskService) UnassignUser(taskId, requestingUserId string) (*Task, error) {
	err := s.permissionService.VerifyAssignment(taskId, requestingUserId)
	if err != nil {
		return nil, err
	}

	task, err := s.store.unassignUser(taskId)
	if err != nil {
		return nil, err
	}
	s.Log("Unassigned user %s from task %s", requestingUserId, taskId)

	return task, nil
}

// SetProcessPoints updates the process points on task "id". When "needsAssignedUser" is true on the project, this
// function also checks, whether the assigned user is equal to the requesting User.
func (s *TaskService) SetProcessPoints(taskId string, newPoints int, requestingUserId string) (*Task, error) {
	needsAssignment, err := s.permissionService.AssignmentInTaskNeeded(taskId)
	if err != nil {
		return nil, err
	}
	if needsAssignment {
		err := s.permissionService.VerifyAssignment(taskId, requestingUserId)
		if err != nil {
			return nil, err
		}
	} else { // when no assignment is needed, the requesting user at least needs to be a member
		err := s.permissionService.VerifyMembershipTask(taskId, requestingUserId)
		if err != nil {
			s.Err("user not a member of the project, the task %s belongs to", taskId)
			return nil, err
		}
	}

	task, err := s.store.getTask(taskId)
	if err != nil {
		return nil, err
	}

	// New process points should be in the range "[0, MaxProcessPoints]" (so including 0 and MaxProcessPoints)
	if newPoints < 0 || task.MaxProcessPoints < newPoints {
		return nil, errors.New("process points out of range")
	}

	task, err = s.store.setProcessPoints(taskId, newPoints)
	if err != nil {
		return nil, err
	}
	s.Log("Set process points of task %s to %d", taskId, newPoints)

	return task, nil
}

// Delete will remove the given tasks, if the requestingUser is a member of the project these tasks are in.
// WARNING: This method, unfortunately, doesn't check the task relation to project, so there might be broken references
// left (from a project to a not existing task). So: USE WITH CARE!!!
// This relates to the github issue https://github.com/hauke96/simple-task-manager/issues/33
func (s *TaskService) Delete(taskIds []string, requestingUserId string) error {
	err := s.permissionService.VerifyMembershipTasks(taskIds, requestingUserId)
	if err != nil {
		return err
	}

	err = s.store.delete(taskIds)
	if err != nil {
		return err
	}
	s.Log("Deleted tasks %v", taskIds)

	return nil
}
