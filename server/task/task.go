package task

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/pkg/errors"
	"strings"
)

type Task struct {
	Id               string      `json:"id"`
	ProcessPoints    int         `json:"processPoints"`
	MaxProcessPoints int         `json:"maxProcessPoints"`
	Geometry         [][]float64 `json:"geometry"`
	AssignedUser     string      `json:"assignedUser"`
}

type taskStore interface {
	init(db *sql.DB)
	getTasks(taskIds []string) ([]*Task, error)
	getTask(taskId string) (*Task, error)
	addTasks(newTasks []*Task) ([]*Task, error)
	assignUser(taskId, userId string) (*Task, error)
	unassignUser(taskId string) (*Task, error)
	setProcessPoints(taskId string, newPoints int) (*Task, error)
	delete(taskIds []string) error
}

var (
	store taskStore
)

func Init() {
	db, err := sql.Open("postgres", "user=postgres password=geheim dbname=stm sslmode=disable")
	sigolo.FatalCheck(err)

	store = &storePg{}
	store.init(db)
}

// GetTasks checks the membership of the requesting user and gets the tasks requested by the IDs.
func GetTasks(taskIds []string, requestingUserId string) ([]*Task, error) {
	err := permission.VerifyMembershipTasks(taskIds, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, "user membership verification failed")
	}

	return store.getTasks(taskIds)
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func AddTasks(newTasks []*Task) ([]*Task, error) {
	for _, t := range newTasks {
		if t.ProcessPoints < 0 || t.MaxProcessPoints < 1 || t.MaxProcessPoints < t.ProcessPoints {
			return nil, errors.New(fmt.Sprintf("process points of task are out of range (%d / %d)", t.ProcessPoints, t.MaxProcessPoints))
		}
	}

	return store.addTasks(newTasks)
}

func AssignUser(taskId, userId string) (*Task, error) {
	task, err := store.getTask(taskId)
	if err != nil {
		return nil, errors.Wrap(err, "could not get task to assign userId")
	}

	// Task has already an assigned user
	if strings.TrimSpace(task.AssignedUser) != "" {
		return nil, fmt.Errorf("task %s has already an assigned userId, cannot overwrite", task.Id)
	}

	return store.assignUser(taskId, userId)
}

func UnassignUser(taskId, requestingUserId string) (*Task, error) {
	err := permission.VerifyAssignment(taskId, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, "user assignment verification failed")
	}

	return store.unassignUser(taskId)
}

// SetProcessPoints updates the process points on task "id". When "needsAssignedUser" is true on the project, this
// function also checks, whether the assigned user is equal to the requesting User.
func SetProcessPoints(taskId string, newPoints int, requestingUserId string) (*Task, error) {
	needsAssignment, err := permission.AssignmentInTaskNeeded(taskId)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get assignment requirement for setting process points")
	}
	if needsAssignment {
		err := permission.VerifyAssignment(taskId, requestingUserId)
		if err != nil {
			return nil, errors.Wrap(err, "user assignment verification failed")
		}
	} else { // when no assignment is needed, the requesting user at least needs to be a member
		err := permission.VerifyMembershipTask(taskId, requestingUserId)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("user not a member of the project, the task %s belongs to", taskId))
		}
	}

	task, err := store.getTask(taskId)
	if err != nil {
		return nil, errors.Wrap(err, "could not get task to set process points")
	}

	// New process points should be in the range "[0, MaxProcessPoints]" (so including 0 and MaxProcessPoints)
	if newPoints < 0 || task.MaxProcessPoints < newPoints {
		return nil, errors.New("process points out of range")
	}

	return store.setProcessPoints(taskId, newPoints)
}

// Delete will remove the given tasks, if the requestingUser is a member of the project these tasks are in.
// WARNING: This method, unfortunately, doesn't check the task relation to project, so there might be broken references
// left (from a project to a not existing task). So: USE WITH CARE!!!
// This relates to the github issue https://github.com/hauke96/simple-task-manager/issues/33
func Delete(taskIds []string, requestingUserId string) error {
	err := permission.VerifyMembershipTasks(taskIds, requestingUserId)
	if err != nil {
		return errors.Wrap(err, "user membership verification failed")
	}

	err = store.delete(taskIds)
	if err != nil {
		return errors.Wrap(err, "unable to remove tasks")
	}

	return nil
}
