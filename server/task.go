package main

import (
	"github.com/hauke96/sigolo"
)

type Task struct {
	Id               string      `json:"id"`
	ProcessPoints    int         `json:"processPoints"`
	MaxProcessPoints int         `json:"maxProcessPoints"`
	Geometry         [][]float64 `json:"geometry"`
	AssignesUser     string      `json:"assignedUser"`
}

var (
	tasks []Task
)

func InitTasks() {
	startY := 53.5484
	startX := 9.9714

	tasks = make([]Task, 0)
	for i := 0; i < 5; i++ {
		geom := make([][]float64, 0)
		geom = append(geom, []float64{startX, startY})
		geom = append(geom, []float64{startX + 0.01, startY})
		geom = append(geom, []float64{startX + 0.01, startY + 0.01})
		geom = append(geom, []float64{startX, startY + 0.01})
		geom = append(geom, []float64{startX, startY})

		startX += 0.01

		tasks = append(tasks, Task{
			Id:               "t-" + GetId(),
			ProcessPoints:    0,
			MaxProcessPoints: 100,
			Geometry:         geom,
		})
	}

	tasks[0].AssignesUser = "Peter"
	tasks[4].AssignesUser = "Maria"
}

func GetTasks(taskIds []string) []Task {
	result := make([]Task, 0)
	for _, t := range tasks {
		for _, i := range taskIds {
			if t.Id == i {
				result = append(result, t)
			}
		}
	}

	return result
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func AddTasks(newTasks []Task) []Task {
	for i, t := range newTasks {
		t.Id = "t-" + GetId()
		tasks = append(tasks, t)
		newTasks[i] = t
	}
	sigolo.Info("%#v", newTasks)

	return newTasks
}
