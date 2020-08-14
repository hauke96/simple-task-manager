package task

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/test"
	"github.com/pkg/errors"
	"testing"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

var (
	tx *sql.Tx
	s  *TaskService
	h  *test.TestHelper
)

func TestMain(m *testing.M) {
	h = &test.TestHelper{
		Setup: setup,
	}
}

func setup() {
	config.LoadConfig("../config/test.json")
	test.InitWithDummyData()
	sigolo.LogLevel = sigolo.LOG_DEBUG

	var err error
	tx, err = database.GetTransaction()
	if err != nil {
		panic(err)
	}

	h.Tx = tx
	permissionService := permission.Init(tx)
	s = Init(tx, permissionService)
}

func TestGetTasks(t *testing.T) {
	h.Run(t, func() error {
		ids := []string{"2", "3"}

		tasks, err := s.GetTasks(ids, "Clara")

		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		fmt.Printf("0: %#v\n", tasks[0])
		fmt.Printf("1: %#v\n", tasks[1])

		t1 := tasks[0]
		if t1.Id != "2" ||
			t1.AssignedUser != "" ||
			t1.MaxProcessPoints != 100 ||
			t1.ProcessPoints != 100 {
			return errors.New(fmt.Sprintf("Task 2 does not match\n"))
		}

		t2 := tasks[1]
		if t2.Id != "3" ||
			t2.AssignedUser != "Maria" ||
			t2.MaxProcessPoints != 100 ||
			t2.ProcessPoints != 50 {
			return errors.New(fmt.Sprintf("Task 3 does not match\n"))
		}

		// TODO Uncomment this when task-IDs are integers in the code as well. The problem here: The test itself works but the tearDown makes a commit which lets the test fail due to these invalid ID types (here string instead of integer)
		// not existing task should cause error
		//_, err = s.GetTasks([]string{"an id", "yet another id"}, "Anna")
		//if err == nil { // database returns just not a task
		//	return errors.New(fmt.Sprintf("Should not be able to get not existing tasks\n"))
		//}
		return nil
	})
}

func TestAddTasks(t *testing.T) {
	h.Run(t, func() error {
		rawTask := &Task{
			ProcessPoints:    5,
			MaxProcessPoints: 250,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]},\"properties\":null}",
			AssignedUser:     "Mark",
		}

		addedTasks, err := s.AddTasks([]*Task{rawTask}, "1")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		validTaskWithId := addedTasks[0]
		if validTaskWithId.AssignedUser != "Mark" ||
			validTaskWithId.MaxProcessPoints != 250 ||
			validTaskWithId.ProcessPoints != 5 {
			return errors.New(fmt.Sprintf("Added task does not match\n"))
		}
		return nil
	})
}

func TestAddTasksInvalidProcessPoints(t *testing.T) {
	h.Run(t, func() error {
		// Max points = 0 is not allowed
		rawTask := &Task{
			ProcessPoints:    0,
			MaxProcessPoints: 0,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]},\"properties\":null}",
			AssignedUser:     "Mark",
		}

		_, err := s.AddTasks([]*Task{rawTask}, "1")
		if err == nil {
			return errors.New(fmt.Sprintf("Adding task with maxProcessPoints=0 should not be possible"))
		}

		// More points than max is not allowed
		rawTask.ProcessPoints = 20
		rawTask.MaxProcessPoints = 10

		_, err = s.AddTasks([]*Task{rawTask}, "1")
		if err == nil {
			return errors.New(fmt.Sprintf("Adding task with more than maxProcessPoints should not be possible"))
		}

		// Negative numbers aren't allowed
		rawTask.ProcessPoints = 0
		rawTask.MaxProcessPoints = -5

		_, err = s.AddTasks([]*Task{rawTask}, "1")
		if err == nil {
			return errors.New(fmt.Sprintf("Adding task with negative maxProcessPoints should not be possible"))
		}

		// Even negative numbers aren't allowed
		rawTask.ProcessPoints = -5
		rawTask.MaxProcessPoints = 10

		_, err = s.AddTasks([]*Task{rawTask}, "1")
		if err == nil {
			return errors.New(fmt.Sprintf("Adding task with negative processPoints should not be possible"))
		}
		return nil
	})
}

func TestAssignUser(t *testing.T) {
	h.Run(t, func() error {
		task, err := s.AssignUser("2", "assigned-user")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		if task.AssignedUser != "assigned-user" {
			return errors.New(fmt.Sprintf("Assigned user on task does not match\n"))
		}

		// not existing task should cause error
		_, err = s.AssignUser("300", "assigned-user")
		if err == nil { // database returns just not a task
			return errors.New(fmt.Sprintf("Should be unable to assign user to not existing task\n"))
		}

		// Assign user who is not a member should fail
		_, err = s.AssignUser("2", "non-member user")
		if err == nil {
			return errors.New(fmt.Sprintf("Should not be able to assigned user who is not a member of the project"))
		}
		return nil
	})
}

func TestAssignUserTwice(t *testing.T) {
	h.Run(t, func() error {
		_, err := s.AssignUser("4", "foo-bar")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		_, err = s.AssignUser("4", "foo-bar")
		if err == nil {
			return errors.New(fmt.Sprintf("Should not be able to overwrite assigned user"))
		}
		return nil
	})
}

func TestUnassignUser(t *testing.T) {
	h.Run(t, func() error {
		s.AssignUser("2", "assigned-user")

		task, err := s.UnassignUser("2", "assigned-user")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		if task.AssignedUser != "" {
			return errors.New(fmt.Sprintf("Assigned user on task not empty\n"))
		}

		// not existing task should cause error
		_, err = s.UnassignUser("300", "assigned-user")
		if err == nil { // database returns just not a task
			return errors.New(fmt.Sprintf("Should be unable to unassign user from not existing task\n"))
		}

		// Unassign totally different user
		_, err = s.UnassignUser("2", "different assigned-user")
		if err == nil {
			return errors.New(fmt.Sprintf("Should not be able to unassigned different user"))
		}
		return nil
	})
}

func TestSetProcessPoints(t *testing.T) {
	h.Run(t, func() error {
		// Test Increase number
		task, err := s.SetProcessPoints("3", 70, "Maria")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		if task.ProcessPoints != 70 {
			return errors.New(fmt.Sprintf("Increase should work\n"))
		}

		// Test Decrease number
		task, err = s.SetProcessPoints("3", 10, "Maria")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		if task.ProcessPoints != 10 {
			return errors.New(fmt.Sprintf("Decrease should work\n"))
		}

		// Test negative number
		task, err = s.SetProcessPoints("3", -10, "Maria")
		if err == nil {
			return errors.New(fmt.Sprintf("Negative numbers not allowed\n"))
		}

		// Test not assigned user
		task, err = s.SetProcessPoints("3", 20, "Max")
		if err == nil {
			return errors.New(fmt.Sprintf("Only assigned user is allowed to set process points\n"))
		}

		// Test not existing project
		task, err = s.SetProcessPoints("300", 20, "Max")
		if err == nil { // database returns just not a task
			return errors.New(fmt.Sprintf("Should be unable to set points on not existing task\n"))
		}

		// Task where no assignment is needed
		_, err = s.SetProcessPoints("5", 20, "Otto")
		if err != nil {
			return errors.New(fmt.Sprintf("Should be able to set process points without assignment: %s", err.Error()))
		}
		return nil
	})
}

func TestDelete(t *testing.T) {
	h.Run(t, func() error {
		// tasks of project 2
		taskIds := []string{"6", "7"}

		err := s.Delete(taskIds, "Maria")
		if err != nil {
			return errors.New(fmt.Sprintf("error deleting tasks: %s", err.Error()))
		}

		for i := 0; i < len(taskIds); i++ {
			tasks, err := s.GetTasks([]string{taskIds[i]}, "Maria")
			if tasks != nil && len(tasks) > 0 {
				return errors.New(fmt.Sprintf("It should not be possible to read task '%s': %#v", taskIds[i], tasks[0]))
			}
			if err == nil {
				return errors.New(fmt.Sprintf("The task %s should not exist anymore", taskIds[i]))
			}
		}
		return nil
	})
}
