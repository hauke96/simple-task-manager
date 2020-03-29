package main

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
}

func GetTasks() []Task {
	return tasks
}
