package task

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/test"
	"github.com/hauke96/simple-task-manager/server/util"
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

	m.Run()
}

func setup() {
	config.LoadConfig("../config/test.json")
	test.InitWithDummyData(config.Conf.DbUsername, config.Conf.DbPassword)
	sigolo.LogLevel = sigolo.LOG_DEBUG

	logger := util.NewLogger()

	var err error
	tx, err = database.GetTransaction(logger)
	if err != nil {
		panic(err)
	}

	h.Tx = tx
	permissionService := permission.Init(tx, logger)
	s = Init(tx, logger, permissionService)
}

func TestGetTasks(t *testing.T) {
	h.Run(t, func() error {
		tasks, err := s.store.GetTasks("3")

		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		fmt.Printf("0: %#v\n", tasks[0])
		fmt.Printf("1: %#v\n", tasks[1])

		t1 := tasks[0]
		if t1.Id != "5" ||
			t1.AssignedUser != "" ||
			t1.MaxProcessPoints != 1000 ||
			t1.ProcessPoints != 345 {
			return errors.New(fmt.Sprintf("Task 2 does not match\n"))
		}

		t2 := tasks[1]
		if t2.Id != "8" ||
			t2.AssignedUser != "Otto" ||
			t2.MaxProcessPoints != 1000 ||
			t2.ProcessPoints != 0 {
			return errors.New(fmt.Sprintf("Task 3 does not match\n"))
		}

		return nil
	})
}

func TestGetTasksUnknownProject(t *testing.T) {
	h.Run(t, func() error {
		_, err := s.store.GetTasks("42")

		if err == nil {
			return errors.New("Project 42 doesn't exist, getting tasks should not work")
		}

		return nil
	})
}

func TestAddTasks(t *testing.T) {
	h.Run(t, func() error {
		rawTask := TaskDraftDto{
			MaxProcessPoints: 250,
			ProcessPoints:    123,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]]},\"properties\":null}",
		}

		addedTasks, err := s.AddTasks([]TaskDraftDto{rawTask}, "1")
		if err != nil {
			return errors.New(fmt.Sprintf("Error: %s\n", err.Error()))
		}

		addedTask := addedTasks[1] // [0] is the original task from the dummy data
		if addedTask.AssignedUser != "" ||
			addedTask.MaxProcessPoints != rawTask.MaxProcessPoints ||
			addedTask.Geometry != rawTask.Geometry ||
			addedTask.ProcessPoints != rawTask.ProcessPoints {
			return errors.New(fmt.Sprintf("Added task does not match:\n%v\n%v\n", rawTask, addedTask))
		}
		return nil
	})
}

func TestAddTasksInvalidProcessPoints(t *testing.T) {
	h.Run(t, func() error {
		// Max points = 0 is not allowed
		rawTask := TaskDraftDto{
			MaxProcessPoints: 0,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]]},\"properties\":null}",
		}

		_, err := s.AddTasks([]TaskDraftDto{rawTask}, "1")
		if err == nil {
			return errors.New(fmt.Sprintf("Adding task with maxProcessPoints=0 should not be possible"))
		}
		s.Log(err.Error())

		// Negative numbers aren't allowed
		rawTask.MaxProcessPoints = -5

		_, err = s.AddTasks([]TaskDraftDto{rawTask}, "1")
		if err == nil {
			return errors.New(fmt.Sprintf("Adding task with negative maxProcessPoints should not be possible"))
		}
		return nil
	})
}

func TestAddTasksInvalidGeometry(t *testing.T) {
	h.Run(t, func() error {
		t := TaskDraftDto{
			MaxProcessPoints: 10,
			Geometry:         "",
		}

		// Geometry field is empty
		_, err := s.AddTasks([]TaskDraftDto{t}, "1")
		if err == nil {
			return errors.New("adding task without geometry (nil) should fail")
		}

		// Just a geometry, not a feature
		t.Geometry = "{\"type\":\"Polygon\",\"coordinates\":[[0,0],[1,0]]}"
		_, err = s.AddTasks([]TaskDraftDto{t}, "1")
		if err == nil {
			return errors.New("adding task with geometry only should fail")
		}

		// Empty geometry
		t.Geometry = "{\"type\":\"Feature\",\"geometry\":{},\"properties\":null}"
		_, err = s.AddTasks([]TaskDraftDto{t}, "1")
		if err == nil {
			return errors.New("adding task with empty geometry object should fail")
		}

		// Not a polygon
		t.Geometry = "{\"type\":\"Feature\",\"geometry\":{\"type\":\"LineString\",\"coordinates\":[[0,0],[1,0]]},\"properties\":null}"
		_, err = s.AddTasks([]TaskDraftDto{t}, "1")
		if err == nil {
			return errors.New("adding task with non-polygon geometry should fail")
		}
		s.Log(err.Error())

		// very old format for the task geometry
		t.Geometry = "[[0,1],[2,3],[4,0]"
		_, err = s.AddTasks([]TaskDraftDto{t}, "1")
		if err == nil {
			return errors.New("adding task with old coordinate list format should fail")
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

		remainingTasks, err := s.store.GetTasks("2")
		if err != nil {
			return errors.New("Getting remaining tasks should work")
		}

		if len(remainingTasks) != 3 {
			return errors.New(fmt.Sprintf("Expect 3 remaining tasks but found %d", len(remainingTasks)))
		}

		return nil
	})
}
