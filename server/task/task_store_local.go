package task

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"../util"
)

type storeLocal struct {
	tasks []*Task
}

func (s *storeLocal) init(db *sql.DB) {
	startY := 53.5484
	startX := 9.9714

	s.tasks = make([]*Task, 0)
	for i := 0; i < 8; i++ {
		geom := make([][]float64, 0)
		geom = append(geom, []float64{startX, startY})
		geom = append(geom, []float64{startX + 0.01, startY})
		geom = append(geom, []float64{startX + 0.01, startY + 0.01})
		geom = append(geom, []float64{startX, startY + 0.01})
		geom = append(geom, []float64{startX, startY})

		startX += 0.01

		s.tasks = append(s.tasks, &Task{
			Id:               "t-" + util.GetId(),
			ProcessPoints:    0,
			MaxProcessPoints: 100,
			Geometry:         geom,
		})
	}

	s.tasks[0].AssignedUser = "Peter"
	s.tasks[4].AssignedUser = "Maria"
}

func (s *storeLocal) getTasks(taskIds []string) ([]*Task, error) {
	result := make([]*Task, 0)
	for _, t := range s.tasks {
		for _, i := range taskIds {
			if t.Id == i {
				result = append(result, t)
			}
		}
	}

	return result, nil
}

func (s *storeLocal) getTask(id string) (*Task, error) {
	for _, t := range s.tasks {
		if t.Id == id {
			return t, nil
		}
	}

	return nil, errors.New(fmt.Sprintf("Task with id '%s' not found", id))
}

func (s *storeLocal) addTasks(newTasks []*Task) ([]*Task, error) {
	result := make([]*Task, 0)

	for _, t := range newTasks {
		t.Id = "t-" + util.GetId()
		result = append(result, t)
	}

	s.tasks = append(s.tasks, result...)

	return result, nil
}

func (s *storeLocal) assignUser(id, user string) (*Task, error) {
	task, err := s.getTask(id)
	if err == nil {
		if strings.TrimSpace(task.AssignedUser) == "" {
			task.AssignedUser = user
		} else {
			err = errors.New(fmt.Sprintf("User '%s' already assigned, cannot overwrite", task.AssignedUser))
			task = nil
		}
	}

	return task, err
}

func (s *storeLocal) unassignUser(id, user string) (*Task, error) {
	task, err := s.getTask(id)
	if err == nil {
		assignedUser := strings.TrimSpace(task.AssignedUser)
		if assignedUser != "" {
			if assignedUser == user {
				task.AssignedUser = ""
			} else {
				err = errors.New(fmt.Sprintf("The assigned user (%s) and the user to unassign (%s) differ", task.AssignedUser, user))
				task = nil
			}
		} else {
			err = errors.New(fmt.Sprintf("User '%s' already assigned, cannot overwrite", task.AssignedUser))
			task = nil
		}
	}

	return task, err
}

func (s *storeLocal) setProcessPoints(id string, newPoints int) (*Task, error) {
	task, err := s.getTask(id)
	if err == nil {
		if 0 <= newPoints && newPoints <= task.MaxProcessPoints {
			task.ProcessPoints = newPoints
		} else {
			msg := fmt.Sprintf("Cannot set process points on task '%s'. The given amount of process points (%d) is lower than 0 or larger than the maximum number of points (%d)",
				task.Id,
				newPoints,
				task.MaxProcessPoints)

			return nil, errors.New(msg)
		}
	}

	return task, nil
}
