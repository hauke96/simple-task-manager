package project

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/hauke96/sigolo"

	"../config"
	"../task"
)

type Project struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	TaskIDs []string `json:"taskIds"`
	Users   []string `json:"users"`
	Owner   string   `json:"owner"`
}

type store interface {
	init(db *sql.DB)
	getProjects(user string) ([]*Project, error)
	getProject(id string) (*Project, error)
	addProject(draft *Project, user string) (*Project, error)
	addUser(userToAdd string, id string, owner string) (*Project, error)
	delete(id string) error
	getTasks(projectId string) ([]*task.Task, error)
}

var (
	projectStore store
)

func Init() {
	if config.Conf.Store == "postgres" {
		db, err := sql.Open("postgres", "user=postgres password=geheim dbname=stm sslmode=disable")
		sigolo.FatalCheck(err)

		projectStore = &storePg{}
		projectStore.init(db)
	} else if config.Conf.Store == "cache" {
		projectStore = &storeLocal{}
		projectStore.init(nil)
	}
}

func GetProjects(user string) ([]*Project, error) {
	return projectStore.getProjects(user)
}

func AddProject(project *Project, user string) (*Project, error) {
	return projectStore.addProject(project, user)
}

func GetProject(id string) (*Project, error) {
	return projectStore.getProject(id)
}

func AddUser(user, id, potentialOwner string) (*Project, error) {
	p, err := projectStore.getProject(id)
	if err != nil {
		return nil, err
	}

	// Only the owner is allowed to invite
	if p.Owner != potentialOwner {
		return nil, errors.New(fmt.Sprintf("User '%s' is not allowed to add another user", potentialOwner))
	}

	// Check if user is already in project. If so, just do nothing and return
	for _, u := range p.Users {
		if u == user {
			return p, errors.New("User already added")
		}
	}

	return projectStore.addUser(user, id, potentialOwner)
}

// VerifyOwnership checks whether all given tasks are part of projects where the
// given user is a member of. In other words: This function checks if the user
// has the permission to change each task.
func VerifyOwnership(user string, taskIds []string) (bool, error) {
	// Only look at projects the user is part of. We then need less checks below
	userProjects, err := GetProjects(user)
	if err != nil {
		return false, err
	}

	for _, taskId := range taskIds {
		found := false

		for _, project := range userProjects {
			for _, t := range project.TaskIDs {
				found = t == taskId

				if found {
					break
				}
			}

			if found {
				break
			}
		}

		// We went through all projects the given user is member of and we didn't
		// find a match. The user is therefore not allowed to view the current
		// task and we can abort here.
		if !found {
			return false, nil
		}
	}

	return true, nil
}

func DeleteProject(id string) error {
	// TODO only owner should be able to do that
	// TODO write tests
	return projectStore.delete(id)
}

func GetTasks(projectId string) ([]*task.Task, error) {
	return projectStore.getTasks(projectId)
}