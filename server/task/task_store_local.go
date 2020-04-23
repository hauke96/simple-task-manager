package task

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/util"
)

type storeLocal struct {
	tasks []*Task
}

func (s *storeLocal) init(db *sql.DB) {
	s.tasks = make([]*Task, 0)
	s.tasks = append(s.tasks, &Task{
		Id:               "1",
		ProcessPoints:    0,
		MaxProcessPoints: 10,
		Geometry:         [][]float64{{0.00008929616120192039, 0.00048116846605239516}, {0.00008929616120192039, 0.0004811765447811922}, {0.00008930976265082209, 0.0004811765447811922}, {0.00008930976265082209, 0.00048116846605239516}, {0.00008929616120192039, 0.00048116846605239516}},
		AssignedUser:     "Peter"})
	s.tasks = append(s.tasks, &Task{
		Id:               "2",
		ProcessPoints:    100,
		MaxProcessPoints: 100,
		Geometry:         [][]float64{{0.00008929616120192039, 0.0004811765447811922}, {0.00008929616120192039, 0.00048118462350998925}, {0.00008930976265082209, 0.00048118462350998925}, {0.00008930976265082209, 0.0004811765447811922}, {0.00008929616120192039, 0.0004811765447811922}},
		AssignedUser:     ""})
	s.tasks = append(s.tasks, &Task{
		Id:               "3",
		ProcessPoints:    50,
		MaxProcessPoints: 100,
		Geometry:         [][]float64{{9.944421814136854, 53.56429528684478}, {9.944078491382948, 53.56200127796407}, {9.94528012102162, 53.56195029857588}, {9.946653412037245, 53.56429528684478}, {9.944421814136854, 53.56429528684478}},
		AssignedUser:     "Maria"})
	s.tasks = append(s.tasks, &Task{
		Id:               "4",
		ProcessPoints:    0,
		MaxProcessPoints: 100,
		Geometry:         [][]float64{{9.951631591968885, 53.563785517845105}, {9.935667083912245, 53.55022340710764}, {10.00639157121693, 53.53675896834966}, {10.013773010425917, 53.570921724776724}, {9.951631591968885, 53.563785517845105}},
		AssignedUser:     ""})

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

	return nil, fmt.Errorf("task with id '%s' not found", id)
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
