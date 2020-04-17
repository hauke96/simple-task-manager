package project

import (
	"flag"
	"github.com/hauke96/sigolo"
	"testing"

	"../config"
	"../task"
	"../util"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

var useDatabase = flag.Bool("with-db", false, "Whether to use the database as well (next to the cache) or not")

func preparePg() {
	config.Conf = &config.Config{
		Store: "postgres",
	}

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
	task.Init()
}

func prepareCache() {
	config.Conf = &config.Config{
		Store: "cache",
	}

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
	task.Init()

	projects := make([]*Project, 0)
	projects = append(projects, &Project{
		Id:      "1",
		Name:    "Project 1",
		TaskIDs: []string{"3"},
		Users:   []string{"Peter", "Maria"},
		Owner:   "Peter",
	})
	projects = append(projects, &Project{
		Id:      "2",
		Name:    "Project 2",
		TaskIDs: []string{"4,5,6"},
		Users:   []string{"Maria", "John", "Anna"},
		Owner:   "Maria",
	})

	// Set global project store but also store it locally here to access the internal fields of the local store.
	s := projectStore.(*storeLocal)
	s.projects = projects
}

func TestVerifyOwnership_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testVerifyOwnership(t)
}

func TestVerifyOwnership_cache(t *testing.T) {
	prepareCache()
	testVerifyOwnership(t)
}

func testVerifyOwnership(t *testing.T) {
	// Test ownership of tasks of project 1
	b, err := VerifyOwnership("Peter", []string{"3"})
	if err != nil {
		t.Error("Verification of ownership should work: %w", err)
		t.Fail()
		return
	}
	if !b { // expect t=true
		t.Errorf("Petern in deed owns task 3")
		t.Fail()
		return
	}

	// Test ownership of tasks of project 2
	b, err = VerifyOwnership("Peter", []string{"4", "5", "6", "6"})
	if err != nil {
		t.Error("Verification of ownership should work: %w", err)
		t.Fail()
		return
	}
	if b { // expect false
		t.Errorf("Petern in deed owns tasks 4, 5 and 6")
		t.Fail()
		return
	}
}

func TestGetProjects_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testGetProjects(t)
}

func TestGetProjects_cache(t *testing.T) {
	prepareCache()
	testGetProjects(t)
}

func testGetProjects(t *testing.T) {
	// For Maria (being part of project 1 and 2)
	userProjects, err := GetProjects("Maria")
	if err != nil {
		t.Error(err.Error())
		t.Fail()
		return
	}
	if !contains("1", userProjects) {
		t.Errorf("Maria is in deed project 1")
		t.Fail()
		return
	}
	if !contains("2", userProjects) {
		t.Errorf("Maria is in deed project 2")
		t.Fail()
		return
	}

	// For Peter (being part of only project 1)
	userProjects, err = GetProjects("Peter")
	if err != nil {
		t.Error("Getting should work: %w", err)
		t.Fail()
		return
	}
	if !contains("1", userProjects) {
		t.Errorf("Peter is in deed project 1")
		t.Fail()
		return
	}
	if contains("2", userProjects) {
		t.Errorf("Peter is not in project 2")
		t.Fail()
		return
	}
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
	tasks, err := GetTasks("1")
	if err != nil {
		t.Error("Get should work: %w", err)
		t.Fail()
		return
	}

	if len(tasks) != 1 {
		t.Error("There should only be one task")
		t.Fail()
		return
	}

	task := tasks[0]

	if task.Id != "3" {
		t.Error("id not matching")
		t.Fail()
		return
	}

	if task.ProcessPoints != 0 {
		t.Error("process points not matching")
		t.Fail()
		return
	}

	if task.MaxProcessPoints != 10 {
		t.Error("max process points not matching")
		t.Fail()
		return
	}

	if task.AssignedUser != "Peter" {
		t.Error("assigned user not matching")
		t.Fail()
		return
	}

	// Not existing project
	_, err = GetTasks("28745276")
	if err == nil {
		t.Error("Get should not work")
		t.Fail()
		return
	}
}

func TestAddAndGetProject_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testAddAndGetProject(t)
}

func TestAddAndGetProject_cache(t *testing.T) {
	prepareCache()
	testAddAndGetProject(t)
}

func testAddAndGetProject(t *testing.T) {
	if config.Conf.Store == "cache" {
		util.NextId = 6
	}

	user := "Jack"
	p := Project{
		Id:      "this should be overwritten",
		Name:    "Test name",
		TaskIDs: []string{"t-11"},
		Users:   []string{"noname-user"},
		Owner:   "noname-user",
	}

	newProject, err := AddProject(&p, user)
	if err != nil {
		t.Error("Adding should work: %w", err)
		t.Fail()
		return
	}

	if len(newProject.Users) != 1 {
		t.Errorf("User amount should be 1 but was %d", len(newProject.Users))
		t.Fail()
		return
	}
	if newProject.Users[0] != user {
		t.Errorf("User should be '%s' but was '%s'", user, newProject.Users[0])
		t.Fail()
		return
	}
	if len(newProject.TaskIDs) != len(p.TaskIDs) || newProject.TaskIDs[0] != p.TaskIDs[0] {
		t.Errorf("Task ID should be '%s' but was '%s'", newProject.TaskIDs[0], p.TaskIDs[0])
		t.Fail()
		return
	}
	if newProject.Name != p.Name {
		t.Errorf("Name should be '%s' but was '%s'", newProject.Name, p.Name)
		t.Fail()
		return
	}
	if newProject.Owner != user {
		t.Errorf("Owner should be '%s' but was '%s'", user, newProject.Owner)
		t.Fail()
		return
	}
}

func TestAddUser_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testAddUser(t)
}

func TestAddUser_cache(t *testing.T) {
	prepareCache()
	testAddUser(t)
}

func testAddUser(t *testing.T) {
	newUser := "new user"

	p, err := AddUser(newUser, "1", "Peter")
	if err != nil {
		t.Error("This should work: %w", err)
		t.Fail()
		return
	}

	containsUser := false
	for _, u := range p.Users {
		if u == newUser {
			containsUser = true
			break
		}
	}
	if !containsUser {
		t.Error("Project should contain new user")
		t.Fail()
		return
	}

	p, err = AddUser(newUser, "2284527", "Peter")
	if err == nil {
		t.Error("This should not work: The project does not exist")
		t.Fail()
		return
	}

	p, err = AddUser(newUser, "1", "Not-Owning-User")
	if err == nil {
		t.Error("This should not work: A non-owner user tries to add a user")
		t.Fail()
		return
	}
}

func TestAddUserTwice_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testAddUserTwice(t)
}

func TestAddUserTwice_cache(t *testing.T) {
	prepareCache()
	testAddUserTwice(t)
}

func testAddUserTwice(t *testing.T) {
	newUser := "another-new-user"

	_, err := AddUser(newUser, "1", "Peter")
	if err != nil {
		t.Error("This should work: %w", err)
		t.Fail()
		return
	}

	// Add second time, this should now work
	_, err = AddUser(newUser, "1", "Peter")
	if err == nil {
		t.Error("Adding a user twice should not work")
		t.Fail()
		return
	}
}

func TestRemoveUser_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testRemoveUser(t)
}

func TestRemoveUser_cache(t *testing.T) {
	prepareCache()
	testRemoveUser(t)
}

func testRemoveUser(t *testing.T) {
	userToRemove := "Maria"

	p, err := RemoveUser("1", "Peter", userToRemove)
	if err != nil {
		t.Error("This should work: %w", err)
		t.Fail()
		return
	}

	containsUser := false
	for _, u := range p.Users {
		if u == userToRemove {
			containsUser = true
			break
		}
	}
	if containsUser {
		t.Error("Project should not contain user anymore")
		t.Fail()
		return
	}

	p, err = RemoveUser("2284527", "Peter", userToRemove)
	if err == nil {
		t.Error("This should not work: The project does not exist")
		t.Fail()
		return
	}

	p, err = RemoveUser("1", "Not-Owning-User", userToRemove)
	if err == nil {
		t.Error("This should not work: A non-owner user should be removed")
		t.Fail()
		return
	}
}

func TestRemoveUserTwice_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testRemoveUserTwice(t)
}

func TestRemoveUserTwice_cache(t *testing.T) {
	prepareCache()
	testRemoveUserTwice(t)
}

func testRemoveUserTwice(t *testing.T) {
	_, err := RemoveUser("2", "Maria", "John")
	if err != nil {
		t.Error("This should work: %w", err)
		t.Fail()
		return
	}

	// "Maria" was removed above to we remove her here the second time
	_, err = RemoveUser("2", "Maria", "John")
	if err == nil {
		t.Error("Removing a user twice should not work")
		t.Fail()
		return
	}
}

func TestLeaveProject_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testLeaveProject(t)
}

func TestLeaveProject_cache(t *testing.T) {
	prepareCache()
	testLeaveProject(t)
}

func testLeaveProject(t *testing.T) {
	userToRemove := "Anna"

	p, err := LeaveProject("2", userToRemove)
	if err != nil {
		t.Error("This should work: %w", err)
		t.Fail()
		return
	}

	containsUser := false
	for _, u := range p.Users {
		if u == userToRemove {
			containsUser = true
			break
		}
	}
	if containsUser {
		t.Error("Project should not contain user anymore")
		t.Fail()
		return
	}

	p, err = LeaveProject("2", "Maria")
	if err == nil {
		t.Error("This should not work: The owner is not allowed to leave")
		t.Fail()
		return
	}

	p, err = LeaveProject("2284527", "Peter")
	if err == nil {
		t.Error("This should not work: The project does not exist")
		t.Fail()
		return
	}

	p, err = LeaveProject("1", "Not-Existing-User")
	if err == nil {
		t.Error("This should not work: A non-existing user should be removed")
		t.Fail()
		return
	}

	// "Maria" was removed above to we remove her here the second time
	_, err = LeaveProject("2", userToRemove)
	if err == nil {
		t.Error("Leaving a project twice should not work")
		t.Fail()
		return
	}
}

func TestDeleteProject_pg(t *testing.T) {
	if !*useDatabase {
		t.SkipNow()
		return
	}

	preparePg()
	testDeleteProject(t)
}

func TestDeleteProject_cache(t *testing.T) {
	prepareCache()
	testDeleteProject(t)
}

func testDeleteProject(t *testing.T) {
	id := "1" // owned by "Peter"

	err := DeleteProject(id, "Maria") // Maria does not own this project
	if err == nil {
		t.Error("Maria does not own this project, this should not work")
		t.Fail()
		return
	}

	err = DeleteProject(id, "Peter") // Maria does not own this project
	if err != nil {
		t.Error("Peter owns this project, this should work")
		t.Fail()
		return
	}

	_, err = GetProject(id)
	if err == nil {
		t.Error("The project should not exist anymore")
		t.Fail()
		return
	}

	err = DeleteProject("45356475", "Peter")
	if err == nil {
		t.Error("This project does not exist, this should not work")
		t.Fail()
		return
	}
}

func contains(projectIdToFind string, projectsToCheck []*Project) bool {
	for _, p := range projectsToCheck {
		if p.Id == projectIdToFind {
			return true
		}
	}

	return false
}
