package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"

	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/task"
)

type Project struct {
	Id          string   `json:"id"`
	Name        string   `json:"name"`
	TaskIDs     []string `json:"taskIds"`
	Users       []string `json:"users"`
	Owner       string   `json:"owner"`
	Description string   `json:"description"`
}

type store interface {
	init(db *sql.DB)
	getProjects(user string) ([]*Project, error)
	getProject(id string) (*Project, error)
	addProject(draft *Project, user string) (*Project, error)
	addUser(userToAdd string, id string, owner string) (*Project, error)
	removeUser(id string, userToRemove string) (*Project, error)
	delete(id string) error
	getTasks(id string) ([]*task.Task, error)
}

var (
	projectStore         store
	maxDescriptionLength = 10000
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

// AddProject adds the project, as requested by user "user".
func AddProject(project *Project, user string) (*Project, error) {
	if project.Id != "" {
		return nil, errors.New("Id not empty")
	}

	if project.Owner == "" {
		return nil, errors.New("Owner must be set")
	}

	usersContainOwner := false
	for _, u := range project.Users {
		usersContainOwner = usersContainOwner || (u == project.Owner)
	}

	if !usersContainOwner {
		return nil, errors.New("Owner must be within users list")
	}

	if project.Name == "" {
		return nil, errors.New("Project must have a title")
	}

	if len(project.TaskIDs) == 0 {
		return nil, errors.New("No tasks have been specified")
	}

	if len(project.Description) > maxDescriptionLength {
		return nil, errors.New(fmt.Sprintf("Description too long. Maximum allowed are %d characters.", maxDescriptionLength))
	}

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
		return nil, fmt.Errorf("user '%s' is not allowed to add another user", potentialOwner)
	}

	// Check if user is already in project. If so, just do nothing and return
	for _, u := range p.Users {
		if u == user {
			return p, errors.New("User already added")
		}
	}

	return projectStore.addUser(user, id, potentialOwner)
}

func LeaveProject(id string, user string) (*Project, error) {
	p, err := projectStore.getProject(id)
	if err != nil {
		return nil, errors.Wrap(err, "could not get project")
	}

	// The owner can only delete a project but not leave it
	if p.Owner == user {
		return nil, fmt.Errorf("the owner '%s' is not allowed to leave the project '%s'", user, p.Id)
	}

	// Check if user is exists in project. If not, throw error
	if !isUserInProject(p, user) {
		return nil, fmt.Errorf("the user '%s' is not part of the project '%s'", user, p.Id)
	}

	return projectStore.removeUser(id, user)
}

func RemoveUser(id, requestingUser, userToRemove string) (*Project, error) {
	p, err := projectStore.getProject(id)
	if err != nil {
		return nil, errors.Wrap(err, "could not get project")
	}

	// When a user tries to remove a different user, only the owner is allowed to do that
	if requestingUser != userToRemove && p.Owner != requestingUser {
		return nil, fmt.Errorf("user '%s' is not allowed to remove another user", requestingUser)
	}

	// Check if user is already in project. If so, just do nothing and return
	projectContainsUser := false
	for _, u := range p.Users {
		if u == userToRemove {
			projectContainsUser = true
			break
		}
	}

	if !projectContainsUser {
		return nil, fmt.Errorf("cannot remove user, project does not contain user '%s'", userToRemove)
	}

	return projectStore.removeUser(id, userToRemove)
}

// VerifyOwnership checks whether all given tasks are part of projects where the
// given user is a member of. In other words: This function checks if the user
// has the permission to change each task.
func VerifyOwnership(user string, taskIds []string) (bool, error) {
	// Only look at projects the user is part of. We then need less checks below
	userProjects, err := GetProjects(user)
	if err != nil {
		return false, errors.Wrap(err, "could not get projects to verify ownership")
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

func DeleteProject(id, potentialOwner string) error {
	p, err := projectStore.getProject(id)
	if err != nil {
		return errors.Wrap(err, "could not get project")
	}

	// Only the owner can delete a project
	if p.Owner != potentialOwner {
		return fmt.Errorf("the user '%s' is not the owner of project '%s'", potentialOwner, p.Id)
	}

	err = projectStore.delete(id)
	if err != nil {
		return errors.Wrap(err, "could not remove project")
	}

	return nil
}

func GetTasks(id string, user string) ([]*task.Task, error) {
	p, err := projectStore.getProject(id)
	if err != nil {
		return nil, errors.Wrap(err, "could not get project")
	}

	// Only members of the project can get tasks
	if !isUserInProject(p, user) {
		return nil, fmt.Errorf("the user '%s' is not a member of the project '%s'", user, p.Id)
	}

	return projectStore.getTasks(id)
}

func isUserInProject(p *Project, user string) bool {
	userIsInProject := false
	for _, u := range p.Users {
		if u == user {
			userIsInProject = true
			break
		}
	}
	return userIsInProject
}
