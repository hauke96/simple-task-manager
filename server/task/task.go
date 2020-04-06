package task

import (
	"database/sql"
	"github.com/hauke96/sigolo"

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
	unassignUser(id, user string) (*Task, error)
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
	return store.assignUser(id, user)
}

func UnassignUser(id, user string) (*Task, error) {
	return store.unassignUser(id, user)
}

func SetProcessPoints(id string, newPoints int) (*Task, error) {
	return store.setProcessPoints(id, newPoints)
}
