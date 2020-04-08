package task

import (
	"../util"
	"database/sql"
	"errors"
	"fmt"
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
			Id:               util.GetId(),
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
	if err != nil {
		return nil, err
	}

	task.AssignedUser = user
	return task, nil
}

func (s *storeLocal) unassignUser(id string) (*Task, error) {
	return s.assignUser(id, "")
}

func (s *storeLocal) setProcessPoints(id string, newPoints int) (*Task, error) {
	task, err := s.getTask(id)
	if err != nil {
		return nil, err
	}

	task.ProcessPoints = newPoints
	return task, nil
}
