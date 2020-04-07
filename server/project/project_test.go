package project

import (
	"testing"

	"../config"
	"../util"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

func prepare() {
	config.LoadConfig("../test/test.json")

	Init()

	if config.Conf.Store == "cache" {
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
			Users:   []string{"Maria"},
			Owner:   "Maria",
		})

		// Set global project store but also store it locally here to access the internal fields of the local store.
		s := projectStore.(*storeLocal)
		s.projects = projects
	}
}

func TestVerifyOwnership(t *testing.T) {
	prepare()

	// Test ownership of tasks of project 1
	b, err := VerifyOwnership("Peter", []string{"3"})
	if err != nil {
		t.Error(err.Error())
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
		t.Error(err.Error())
		t.Fail()
		return
	}
	if b { // expect false
		t.Errorf("Petern in deed owns tasks 4, 5 and 6")
		t.Fail()
		return
	}
}

func TestGetProjects(t *testing.T) {
	prepare()

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
		t.Error(err.Error())
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

func TestAddAndGetProject(t *testing.T) {
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
		t.Error(err.Error())
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

func TestAddUser(t *testing.T) {
	prepare()

	newUser := "new user"

	p, err := AddUser(newUser, "1", "Peter")
	if err != nil {
		t.Error("This should work")
		t.Error(err.Error())
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
		t.Error(err.Error())
		t.Fail()
		return
	}

	p, err = AddUser(newUser, "1", "Not-Owning-User")
	if err == nil {
		t.Error("This should not work: A non-owner user tries to add a user")
		t.Error(err.Error())
		t.Fail()
		return
	}
}

func TestAddUserTwice(t *testing.T) {
	prepare()

	newUser := "new user"

	_, err := AddUser(newUser, "1", "Peter")
	if err != nil {
		t.Error("This should work")
		t.Error(err.Error())
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

func contains(projectIdToFind string, projectsToCheck []*Project) bool {
	for _, p := range projectsToCheck {
		if p.Id == projectIdToFind {
			return true
		}
	}

	return false
}
