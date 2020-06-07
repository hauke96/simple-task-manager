package project

import (
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/permission"
	testHelper "github.com/hauke96/simple-task-manager/server/test"
	"testing"

	"github.com/hauke96/simple-task-manager/server/task"
	_ "github.com/lib/pq" // Make driver "postgres" usable
)

func TestMain(m *testing.M) {
	testHelper.InitWithDummyData()

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
	permission.Init()
	task.Init()

	m.Run()
}

func TestGetProjects(t *testing.T) {
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
		t.Errorf("Getting should work: %s", err.Error())
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

func TestGetProjectByTask(t *testing.T) {
	project, err := GetProjectByTask("4")
	if err != nil {
		t.Error(err.Error())
		t.Fail()
		return
	}

	if project.Id != "2" {
		t.Error("Project ID not matching")
		t.Fail()
		return
	}
}

func TestGetTasks(t *testing.T) {
	tasks, err := GetTasks("1", "Peter")
	if err != nil {
		t.Errorf("Get should work: %s", err.Error())
		t.Fail()
		return
	}

	sigolo.Debug("Tasks: %#v", tasks)

	if len(tasks) != 1 {
		t.Error("There should be exactly one task")
		t.Fail()
		return
	}

	task := tasks[0]
	sigolo.Debug("Task: %#v", task)

	if task.Id != "1" {
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

	// Part of project but not owning
	_, err = GetTasks("1", "Maria")
	if err != nil {
		t.Error("This should work, Maria is part of the project")
		t.Fail()
		return
	}

	// Not part of project
	_, err = GetTasks("1", "Unknown user")
	if err == nil {
		t.Error("Get tasks of not owned project should not work")
		t.Fail()
		return
	}

	// Not existing project
	_, err = GetTasks("28745276", "Peter")
	if err == nil {
		t.Error("Get should not work")
		t.Fail()
		return
	}
}

func TestAddAndGetProject(t *testing.T) {
	user := "Jack"
	p := Project{
		Name:    "Test name",
		TaskIDs: []string{"11"},
		Users:   []string{user, "user2"},
		Owner:   user,
	}

	newProject, err := AddProject(&p)
	if err != nil {
		t.Errorf("Adding should work: %s", err.Error())
		t.Fail()
		return
	}

	if len(newProject.Users) != 2 {
		t.Errorf("User amount should be 2 but was %d", len(newProject.Users))
		t.Fail()
		return
	}
	if newProject.Users[0] != user || newProject.Users[1] != "user2" {
		t.Errorf("User not matching")
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

func TestAddProjectWithUsedTasks(t *testing.T) {
	user := "Jen"
	p := Project{
		Name:    "Test name",
		TaskIDs: []string{"1", "22", "33"}, // one task already used in a project
		Users:   []string{user, "user2"},
		Owner:   user,
	}

	_, err := AddProject(&p)
	if err == nil {
		t.Errorf("The tasks are already used. This should not work.")
		t.Fail()
		return
	}
}

func TestAddUser(t *testing.T) {
	newUser := "new user"

	p, err := AddUser("1", newUser, "Peter")
	if err != nil {
		t.Errorf("This should work: %s", err.Error())
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

	p, err = AddUser("2284527", newUser, "Peter")
	if err == nil {
		t.Error("This should not work: The project does not exist")
		t.Fail()
		return
	}

	p, err = AddUser("1", newUser, "Not-Owning-User")
	if err == nil {
		t.Error("This should not work: A non-owner user tries to add a user")
		t.Fail()
		return
	}
}

func TestAddUserTwice(t *testing.T) {
	newUser := "another-new-user"

	_, err := AddUser("1", newUser, "Peter")
	if err != nil {
		t.Errorf("This should work: %s", err.Error())
		t.Fail()
		return
	}

	// Add second time, this should now work
	_, err = AddUser("1", newUser, "Peter")
	if err == nil {
		t.Error("Adding a user twice should not work")
		t.Fail()
		return
	}
}

func TestRemoveUser(t *testing.T) {
	userToRemove := "Maria"

	p, err := RemoveUser("1", "Peter", userToRemove)
	if err != nil {
		t.Errorf("This should work: %s", err.Error())
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

	tasks, err := task.GetTasks(p.TaskIDs, "Peter")
	if err != nil {
		t.Errorf("Getting tasks should still work")
		t.Fail()
		return
	}

	// Check that the user to remove has been unassigned
	for _, task := range tasks {
		if task.AssignedUser == userToRemove {
			t.Errorf("Task '%s' still has user '%s' assigned", task.Id, userToRemove)
			t.Fail()
			return
		}
	}

	// Not existing project
	p, err = RemoveUser("2284527", "Peter", userToRemove)
	if err == nil {
		t.Error("This should not work: The project does not exist")
		t.Fail()
		return
	}

	// Not owning user requesting removal
	p, err = RemoveUser("1", "Not-Owning-User", userToRemove)
	if err == nil {
		t.Error("This should not work: A non-owner user requests removal")
		t.Fail()
		return
	}
}

func TestRemoveNonOwnerUser(t *testing.T) {
	userToRemove := "Carl"

	// Carl is not owner and removes himself, which is ok
	p, err := RemoveUser("2", "Carl", userToRemove)
	if err != nil {
		t.Errorf("This should work: %s", err.Error())
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
}

func TestRemoveArbitraryUserNotAllowed(t *testing.T) {
	userToRemove := "Anna"

	// Michael is not member of the project and should not be allowed to remove anyone
	p, err := RemoveUser("2", "Michael", userToRemove)
	if err == nil {
		t.Errorf("This should not work: %s", err.Error())
		t.Fail()
		return
	}

	p, err = GetProject("2", "Maria")

	if err != nil {
		t.Error(err.Error())
		t.Fail()
	}

	containsUser := false
	for _, u := range p.Users {
		if u == userToRemove {
			containsUser = true
			break
		}
	}
	if !containsUser {
		t.Error("Project should still contain user")
		t.Fail()
		return
	}

	// Remove not-member user:

	userToRemove = "Nina" // Not a member of the project
	p, err = RemoveUser("2", "Peter", userToRemove)
	if err == nil {
		t.Errorf("This should not work: %s", err.Error())
		t.Fail()
		return
	}
}

func TestRemoveUserTwice(t *testing.T) {
	_, err := RemoveUser("2", "Maria", "John")
	if err != nil {
		t.Error("This should work: ", err)
		t.Fail()
		return
	}

	// "John" was removed above to we remove him here the second time
	_, err = RemoveUser("2", "Maria", "John")
	if err == nil {
		t.Error("Removing a user twice should not work")
		t.Fail()
		return
	}
}

func TestLeaveProject(t *testing.T) {
	userToRemove := "Anna"

	p, err := LeaveProject("2", userToRemove)
	if err != nil {
		t.Errorf("This should work: %s", err.Error())
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

func TestDeleteProject(t *testing.T) {
	id := "1" // owned by "Peter"

	// Try to remove with now-owning user

	err := DeleteProject(id, "Maria") // Maria does not own this project
	if err == nil {
		t.Error("Maria does not own this project, this should not work")
		t.Fail()
		return
	}

	_, err = GetProject(id, "Peter")
	if err != nil {
		t.Errorf("The project should exist: %s", err.Error())
		t.Fail()
		return
	}

	// Actually remove project

	project, err := GetProject(id, "Peter")
	if err != nil {
		t.Errorf("Error getting project to relete: %s", err.Error())
		t.Fail()
		return
	}
	taskIds := project.TaskIDs

	err = DeleteProject(id, "Peter") // Maria does not own this project
	if err != nil {
		t.Errorf("Peter owns this project, this should work: %s", err.Error())
		t.Fail()
		return
	}

	_, err = GetProject(id, "Peter")
	if err == nil {
		t.Error("The project should not exist anymore")
		t.Fail()
		return
	}

	_, err = task.GetTasks(taskIds, "Peter")
	if err == nil {
		t.Error("The tasks should not exist anymore")
		t.Fail()
		return
	}

	// Delete not existing project

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
