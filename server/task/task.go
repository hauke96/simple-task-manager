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
	getTask(id string) (*Task, error)
	addTasks(newTasks []*Task) ([]*Task, error)
	assignUser(id, user string) (*Task, error)
	unassignUser(id string) (*Task, error)
	setProcessPoints(id string, newPoints int) (*Task, error)
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

func GetTasks(taskIds []string, requestingUser string) ([]*Task, error) {
	err := permission.VerifyMembershipTasks(taskIds, requestingUser)
	if err != nil {
		return nil, errors.Wrap(err, "user membership verification failed")
	}

	return store.getTasks(taskIds)
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func AddTasks(newTasks []*Task) ([]*Task, error) {
	return store.addTasks(newTasks)
}

func AssignUser(id, user string) (*Task, error) {
	task, err := store.getTask(id)
	if err != nil {
		return nil, errors.Wrap(err, "could not get task to assign user")
	}

	// Task has already an assigned user
	if strings.TrimSpace(task.AssignedUser) != "" {
		return nil, fmt.Errorf("task %s has already an assigned user, cannot overwrite", task.Id)
	}

	return store.assignUser(id, user)
}

func UnassignUser(id, requestingUser string) (*Task, error) {
	err := permission.VerifyAssignment(id, requestingUser)
	if err != nil {
		return nil, errors.Wrap(err, "user assignment verification failed")
	}

	return store.unassignUser(id)
}

// SetProcessPoints updates the process points on task "id". When "needsAssignedUser" is true, this also checks, whether
// the assigned user is equal to the "user" parameter.
func SetProcessPoints(id string, newPoints int, user string) (*Task, error) {
	needsAssignment, err := permission.AssignmentInTaskNeeded(id)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get assignment requirement for setting process points")
	}
	if needsAssignment {
		err := permission.VerifyAssignment(id, user)
		if err != nil {
			return nil, errors.Wrap(err, "user assignment verification failed")
		}
	} else { // when no assignment is needed, the requesting user at least needs to be a member
		err := permission.VerifyMembershipTask(id, user)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("user not a member of the project, the task %s belongs to", id))
		}
	}

	task, err := store.getTask(id)
	if err != nil {
		return nil, errors.Wrap(err, "could not get task to set process points")
	}

	// New process points should be in the range "[0, MaxProcessPoints]" (so including 0 and MaxProcessPoints)
	if newPoints < 0 || task.MaxProcessPoints < newPoints {
		return nil, errors.New("process points out of range")
	}

	return store.setProcessPoints(id, newPoints)
}
