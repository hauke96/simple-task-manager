package task

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/hauke96/sigolo"
	"strings"

	"../config"
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
	if config.Conf.Store == "postgres" {
		db, err := sql.Open("postgres", "user=postgres password=geheim dbname=stm sslmode=disable")
		sigolo.FatalCheck(err)

		store = &storePg{}
		store.init(db)
	} else if config.Conf.Store == "cache" {
		store = &storeLocal{}
		store.init(nil)
	}
}

func GetTasks(taskIds []string) ([]*Task, error) {
	return store.getTasks(taskIds)
}

func GetTask(id string) (*Task, error) {
	return store.getTask(id)
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func AddTasks(newTasks []*Task) ([]*Task, error) {
	return store.addTasks(newTasks)
}

func AssignUser(id, user string) (*Task, error) {
	task, err := store.getTask(id)
	if err != nil {
		return nil, err
	}

	// Task has already an assigned user
	if strings.TrimSpace(task.AssignedUser) != "" {
		return nil, fmt.Errorf("user '%s' already assigned, cannot overwrite", task.AssignedUser)
	}

	return store.assignUser(id, user)
}

func UnassignUser(id, user string) (*Task, error) {
	task, err := store.getTask(id)
	if err != nil {
		return nil, err
	}

	assignedUser := strings.TrimSpace(task.AssignedUser)
	if assignedUser != user {
		err = errors.New("the assigned user and the user to unassign differ")
		task = nil
	}

	return store.unassignUser(id)
}

func SetProcessPoints(id string, newPoints int, user string) (*Task, error) {
	task, err := store.getTask(id)
	if err != nil {
		return nil, err
	}

	if user != task.AssignedUser {
		return nil, fmt.Errorf("user '%s' not assigned to this task", user)
	}

	// New process points should be in the range "[0, MaxProcessPoints]" (so including 0 and MaxProcessPoints)
	if newPoints < 0 || task.MaxProcessPoints < newPoints {
		return nil, errors.New("process points out of range")
	}

	return store.setProcessPoints(id, newPoints)
}
