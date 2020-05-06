package task

import (
	"flag"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/util"
	"testing"

	"github.com/hauke96/simple-task-manager/server/config"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

var useDatabase = flag.Bool("with-db", false, "Whether to use the database as well (next to the cache) or not")

func preparePg() {
	config.Conf = &config.Config{
		Store: "postgres",
	}

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
}

func prepareCache() {
	config.Conf = &config.Config{
		Store: "cache",
	}

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
}

func TestGetTasks_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testGetTasks(t)
}

func TestGetTasks_cache(t *testing.T) {
	prepareCache()
	testGetTasks(t)
}

func testGetTasks(t *testing.T) {
	ids := []string{"1", "2"}

	tasks, err := GetTasks(ids)

	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	t1 := tasks[0]
	if t1.Id != "1" ||
		t1.AssignedUser != "Peter" ||
		t1.MaxProcessPoints != 10 ||
		t1.ProcessPoints != 0 {
		t.Errorf("Task 1 does not match\n")
		t.Fail()
	}

	t2 := tasks[1]
	if t2.Id != "2" ||
		t2.AssignedUser != "" ||
		t2.MaxProcessPoints != 100 ||
		t2.ProcessPoints != 100 {
		t.Errorf("Task 2 does not match\n")
		t.Fail()
	}

	// not existing task should cause error
	_, err = GetTasks([]string{"an id", "yet another id"})
	if err == nil { // database returns just not a task
		t.Errorf("Should not be able to get not existing tasks\n")
		t.Fail()
	}
}

func TestAddTasks_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testAddTasks(t)
}

func TestAddTasks_cache(t *testing.T) {
	prepareCache()
	util.NextId = 5
	testAddTasks(t)
}

func testAddTasks(t *testing.T) {
	rawTask := &Task{
		ProcessPoints:    5,
		MaxProcessPoints: 250,
		Geometry:         [][]float64{{1.5, 10}},
		AssignedUser:     "Mark",
	}

	addedTasks, err := AddTasks([]*Task{rawTask})
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	validTaskWithId := addedTasks[0]
	if validTaskWithId.Id != "5" ||
		validTaskWithId.AssignedUser != "Mark" ||
		validTaskWithId.MaxProcessPoints != 250 ||
		validTaskWithId.ProcessPoints != 5 {
		t.Errorf("Added task does not match\n")
		t.Fail()
	}
}

func TestAssignUser_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testAssignUser(t)
}

func TestAssignUser_cache(t *testing.T) {
	prepareCache()
	testAssignUser(t)
}

func testAssignUser(t *testing.T) {
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

func TestAssignUserTwice_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testAssignUserTwice(t)
}

func TestAssignUserTwice_cache(t *testing.T) {
	prepareCache()
	testAssignUserTwice(t)
}

func testAssignUserTwice(t *testing.T) {
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

func TestUnassignUser_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	AssignUser("2", "assigned-user")
	testUnassignUser(t)
}

func TestUnassignUser_cache(t *testing.T) {
	prepareCache()
	AssignUser("2", "assigned-user")
	testUnassignUser(t)
}

func testUnassignUser(t *testing.T) {
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

func TestSetProcessPoints_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testSetProcessPoints(t)
}

func TestSetProcessPoints_cache(t *testing.T) {
	prepareCache()
	testSetProcessPoints(t)
}

func testSetProcessPoints(t *testing.T) {
	// Test Increase number
	task, err := SetProcessPoints("3", 70, "Maria", true)
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	if task.ProcessPoints != 70 {
		t.Errorf("Increase should work\n")
		t.Fail()
	}

	// Test Decrease number
	task, err = SetProcessPoints("3", 10, "Maria", true)
	if err != nil {
		t.Errorf("Error: %s\n", err.Error())
		t.Fail()
	}

	if task.ProcessPoints != 10 {
		t.Errorf("Decrease should work\n")
		t.Fail()
	}

	// Test negative number
	task, err = SetProcessPoints("3", -10, "Maria", true)
	if err == nil {
		t.Errorf("Negative numbers not allowed\n")
		t.Fail()
	}

	// Test not assigned user
	task, err = SetProcessPoints("3", 20, "Max", true)
	if err == nil {
		t.Errorf("Only assigned user is allowed to set process points\n")
		t.Fail()
	}

	// Test not existing project
	task, err = SetProcessPoints("300", 20, "Max", true)
	if err == nil { // database returns just not a task
		t.Errorf("Should be unable to set points on not existing task\n")
		t.Fail()
	}
}
