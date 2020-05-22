package task

import (
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/permission"
	testHelper "github.com/hauke96/simple-task-manager/server/test"
	"testing"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

func TestMain(m *testing.M) {
	testHelper.InitWithDummyData()

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
	permission.Init()

	m.Run()
}

func TestGetTasks(t *testing.T) {
	ids := []string{"2", "3"}

	tasks, err := GetTasks(ids, "Clara")

	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
		return
	}

	fmt.Printf("0: %#v\n", tasks[0])
	fmt.Printf("1: %#v\n", tasks[1])

	t1 := tasks[0]
	if t1.Id != "2" ||
		t1.AssignedUser != "" ||
		t1.MaxProcessPoints != 100 ||
		t1.ProcessPoints != 100 {
		t.Errorf("Task 2 does not match\n")
		t.Fail()
	}

	t2 := tasks[1]
	if t2.Id != "3" ||
		t2.AssignedUser != "Maria" ||
		t2.MaxProcessPoints != 100 ||
		t2.ProcessPoints != 50 {
		t.Errorf("Task 3 does not match\n")
		t.Fail()
	}

	// not existing task should cause error
	_, err = GetTasks([]string{"an id", "yet another id"}, "Anna")
	if err == nil { // database returns just not a task
		t.Errorf("Should not be able to get not existing tasks\n")
		t.Fail()
	}
}

func TestAddTasks(t *testing.T) {
	rawTask := &Task{
		ProcessPoints:    5,
		MaxProcessPoints: 250,
		Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]},\"properties\":null}",
		AssignedUser:     "Mark",
	}

	addedTasks, err := AddTasks([]*Task{rawTask})
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	validTaskWithId := addedTasks[0]
	if validTaskWithId.Id != "8" ||
		validTaskWithId.AssignedUser != "Mark" ||
		validTaskWithId.MaxProcessPoints != 250 ||
		validTaskWithId.ProcessPoints != 5 {
		t.Errorf("Added task does not match\n")
		t.Fail()
	}
}

func TestAddTasksInvalidProcessPoints(t *testing.T) {
	// Max points = 0 is not allowed
	rawTask := &Task{
		ProcessPoints:    0,
		MaxProcessPoints: 0,
		Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]},\"properties\":null}",
		AssignedUser:     "Mark",
	}

	_, err := AddTasks([]*Task{rawTask})
	if err == nil {
		t.Errorf("Adding task with maxProcessPoints=0 should not be possible")
		t.Fail()
	}

	// More points than max is not allowed
	rawTask.ProcessPoints = 20
	rawTask.MaxProcessPoints = 10

	_, err = AddTasks([]*Task{rawTask})
	if err == nil {
		t.Errorf("Adding task with more than maxProcessPoints should not be possible")
		t.Fail()
	}

	// Negative numbers aren't allowed
	rawTask.ProcessPoints = 0
	rawTask.MaxProcessPoints = -5

	_, err = AddTasks([]*Task{rawTask})
	if err == nil {
		t.Errorf("Adding task with negative maxProcessPoints should not be possible")
		t.Fail()
	}

	// Even negative numbers aren't allowed
	rawTask.ProcessPoints = -5
	rawTask.MaxProcessPoints = 10

	_, err = AddTasks([]*Task{rawTask})
	if err == nil {
		t.Errorf("Adding task with negative processPoints should not be possible")
		t.Fail()
	}
}

func TestAssignUser(t *testing.T) {
	task, err := AssignUser("2", "assigned-user")
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	if task.AssignedUser != "assigned-user" {
		t.Errorf("Assigned user on task does not match\n")
		t.Fail()
	}

	// not existing task should cause error
	_, err = AssignUser("300", "assigned-user")
	if err == nil { // database returns just not a task
		t.Errorf("Should be unable to assign user to not existing task\n")
		t.Fail()
	}

	// Assign user who is not a member should fail
	_, err = AssignUser("2", "non-member user")
	if err == nil {
		t.Errorf("Should not be able to assigned user who is not a member of the project")
		t.Fail()
	}
}

func TestAssignUserTwice(t *testing.T) {
	_, err := AssignUser("4", "foo-bar")
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	_, err = AssignUser("4", "foo-bar")
	if err == nil {
		t.Errorf("Should not be able to overwrite assigned user")
		t.Fail()
	}
}

func TestUnassignUser(t *testing.T) {
	AssignUser("2", "assigned-user")

	task, err := UnassignUser("2", "assigned-user")
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	if task.AssignedUser != "" {
		t.Errorf("Assigned user on task not empty\n")
		t.Fail()
	}

	// not existing task should cause error
	_, err = UnassignUser("300", "assigned-user")
	if err == nil { // database returns just not a task
		t.Errorf("Should be unable to unassign user from not existing task\n")
		t.Fail()
	}

	// Unassign totally different user
	_, err = UnassignUser("2", "different assigned-user")
	if err == nil {
		t.Errorf("Should not be able to unassigned different user")
		t.Fail()
	}
}

func TestSetProcessPoints(t *testing.T) {
	// Test Increase number
	task, err := SetProcessPoints("3", 70, "Maria")
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	if task.ProcessPoints != 70 {
		t.Errorf("Increase should work\n")
		t.Fail()
	}

	// Test Decrease number
	task, err = SetProcessPoints("3", 10, "Maria")
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	if task.ProcessPoints != 10 {
		t.Errorf("Decrease should work\n")
		t.Fail()
	}

	// Test negative number
	task, err = SetProcessPoints("3", -10, "Maria")
	if err == nil {
		t.Errorf("Negative numbers not allowed\n")
		t.Fail()
	}

	// Test not assigned user
	task, err = SetProcessPoints("3", 20, "Max")
	if err == nil {
		t.Errorf("Only assigned user is allowed to set process points\n")
		t.Fail()
	}

	// Test not existing project
	task, err = SetProcessPoints("300", 20, "Max")
	if err == nil { // database returns just not a task
		t.Errorf("Should be unable to set points on not existing task\n")
		t.Fail()
	}

	// Task where no assignment is needed
	_, err = SetProcessPoints("5", 20, "Otto")
	if err != nil {
		t.Errorf("Should be able to set process points without assignment: %s", err.Error())
		t.Fail()
	}
}

func TestDelete(t *testing.T) {
	// tasks of project 2
	taskIds := []string{"6", "7"}

	err := Delete(taskIds, "Maria")
	if err != nil {
		t.Errorf("error deleting tasks: %s", err.Error())
		t.Fail()
		return
	}

	for i := 0; i < len(taskIds); i++ {
		tasks, err := GetTasks([]string{taskIds[i]}, "Maria")
		if tasks != nil && len(tasks) > 0 {
			t.Errorf("It should not be possible to read task '%s': %#v", taskIds[i], tasks[0])
			t.Fail()
			return
		}
		if err == nil {
			t.Errorf("The task %s should not exist anymore", taskIds[i])
			t.Fail()
			return
		}
	}
}
