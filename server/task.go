package main

import (
	"errors"
	"fmt"
	"strings"
)

type Task struct {
	Id               string      `json:"id"`
	ProcessPoints    int         `json:"processPoints"`
	MaxProcessPoints int         `json:"maxProcessPoints"`
	Geometry         [][]float64 `json:"geometry"`
	AssignedUser     string      `json:"assignedUser"`
}

var (
	tasks []*Task
)

func InitTasks() {
	startY := 53.5484
	startX := 9.9714

	tasks = make([]*Task, 0)
	for i := 0; i < 5; i++ {
		geom := make([][]float64, 0)
		geom = append(geom, []float64{startX, startY})
		geom = append(geom, []float64{startX + 0.01, startY})
		geom = append(geom, []float64{startX + 0.01, startY + 0.01})
		geom = append(geom, []float64{startX, startY + 0.01})
		geom = append(geom, []float64{startX, startY})

		startX += 0.01

		tasks = append(tasks, &Task{
			Id:               "t-" + GetId(),
			ProcessPoints:    0,
			MaxProcessPoints: 100,
			Geometry:         geom,
		})
	}

	tasks[0].AssignedUser = "Peter"
	tasks[4].AssignedUser = "Maria"
}

func GetTasks(taskIds []string) []*Task {
	result := make([]*Task, 0)
	for _, t := range tasks {
		for _, i := range taskIds {
			if t.Id == i {
				result = append(result, t)
			}
		}
	}

	return result
}

func GetTask(id string) (*Task, error) {
	for _, t := range tasks {
		if t.Id == id {
			return t, nil
		}
	}

	return nil, errors.New(fmt.Sprintf("Task with id '%s' not found", id))
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func AddTasks(newTasks []Task) []*Task {
	result := make([]*Task, 0)

	for _, t := range newTasks {
		t.Id = "t-" + GetId()
		result = append(result, &t)
	}

	tasks = append(tasks, result...)

	return result
}

func AssignUser(id, user string) (*Task, error) {
	task, err := GetTask(id)
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

func UnassignUser(id, user string) (*Task, error) {
	task, err := GetTask(id)
	if err == nil {
		assignedUser := strings.TrimSpace(task.AssignedUser)
		if assignedUser != "" {
			if assignedUser == user {
				task.AssignedUser = ""
			} else {
				err = errors.New(fmt.Sprintf("The assigned user and the user to unassign differ", task.AssignedUser))
				task = nil
			}
		} else {
			err = errors.New(fmt.Sprintf("User '%s' already assigned, cannot overwrite", task.AssignedUser))
			task = nil
		}
	}

	return task, err
}

func SetProcessPoints(id string, newPoints int) (*Task, error) {
	task, err := GetTask(id)
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
