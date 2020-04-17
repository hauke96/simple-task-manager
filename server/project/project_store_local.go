package project

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/hauke96/sigolo"

	"../task"
	"../util"
)

type storeLocal struct {
	projects []*Project
}

func (s *storeLocal) init(db *sql.DB) {
	s.projects = make([]*Project, 0)
	s.projects = append(s.projects, &Project{
		Id:      util.GetId(),
		Name:    "First project",
		TaskIDs: []string{"t-3", "t-4"},
		Users:   []string{"hauke-stieler"},
		Owner:   "hauke-stieler",
	})
	s.projects = append(s.projects, &Project{
		Id:      util.GetId(),
		Name:    "Foo",
		TaskIDs: []string{"t-5"},
		Users:   []string{"hauke-stieler", "hauke-stieler-dev"},
		Owner:   "hauke-stieler",
	})
	s.projects = append(s.projects, &Project{
		Id:      util.GetId(),
		Name:    "Bar",
		TaskIDs: []string{"t-6", "t-7", "t-8", "t-9", "t-10"},
		Users:   []string{"hauke-stieler-dev"},
		Owner:   "hauke-stieler-dev",
	})
}

func (s *storeLocal) getProjects(user string) ([]*Project, error) {
	result := make([]*Project, 0)

	for _, p := range s.projects {
		for _, u := range p.Users {
			if u == user {
				result = append(result, p)
			}
		}
	}

	return result, nil
}

func (s *storeLocal) addProject(project *Project, user string) (*Project, error) {
	project.Id = util.GetId()
	project.Users = []string{user}
	project.Owner = user
	s.projects = append(s.projects, project)
	return project, nil
}

func (s *storeLocal) getProject(id string) (*Project, error) {
	for _, p := range s.projects {
		sigolo.Debug("Project: %#v", p)
		if p.Id == id {
			return p, nil
		}
	}

	return nil, errors.New(fmt.Sprintf("Project with ID '%s' not found", id))
}

func (s *storeLocal) addUser(user, id, potentialOwner string) (*Project, error) {
	project, err := s.getProject(id)
	if err != nil {
		return nil, err
	}

	project.Users = append(project.Users, user)

	return project, nil
}

func (s *storeLocal) removeUser(id string, userToRemove string) (*Project, error) {
	project, err := s.getProject(id)
	if err != nil {
		return nil, err
	}

	remainingUsers := make([]string, 0)
	containsUserToRemove := false
	for _, u := range project.Users {
		if u != userToRemove {
			remainingUsers = append(remainingUsers, u)
		} else {
			containsUserToRemove = true
		}
	}

	if !containsUserToRemove {
		return nil, errors.New("project does not contain user to remove")
	}

	project.Users = remainingUsers

	return project, nil
}

func (s *storeLocal) delete(id string) error {
	newProjects := make([]*Project, 0)

	for _, p := range s.projects {
		if p.Id != id {
			newProjects = append(newProjects, p)
		}
	}

	s.projects = newProjects

	return nil
}

func (s *storeLocal) getTasks(projectId string) ([]*task.Task, error) {
	p, err := s.getProject(projectId)
	if err != nil {
		return nil, err
	}

	return task.GetTasks(p.TaskIDs)
}
