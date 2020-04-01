package main

import (
	"testing"
)

func prepare() {
	projects = make([]Project, 0)
	projects = append(projects, Project{
		Id:      "p-0",
		Name:    "First project",
		TaskIDs: []string{"t-3", "t-4"},
		Users:   []string{"Peter"},
	})
	projects = append(projects, Project{
		Id:      "p-1",
		Name:    "Foo",
		TaskIDs: []string{"t-5"},
		Users:   []string{"Peter", "Maria"},
	})
	projects = append(projects, Project{
		Id:      "p-2",
		Name:    "Bar",
		TaskIDs: []string{"t-6", "t-7", "t-8", "t-9", "t-10"},
		Users:   []string{"Maria"},
	})
}

func TestVerifyOwnership(t *testing.T) {
	prepare()

	b := VerifyOwnership("Peter", []string{"t-3", "t-4"})
	if !b { // expect t=true
		t.Errorf("Sould be true")
		t.Fail()
	}

	b = VerifyOwnership("Peter", []string{"t-5", "t-5", "t-5"})
	if !b { // expect true
		t.Errorf("Sould be true")
		t.Fail()
	}

	b = VerifyOwnership("Peter", []string{"t-4", "t-5", "t-6"})
	if b { // expect false
		t.Errorf("Sould be false")
		t.Fail()
	}
}

func TestGetProjects(t *testing.T) {
	prepare()

	userProjects := GetProjects("Maria")
	if contains("p-0", userProjects) {
		t.Errorf("Maria doesn't own p-0")
		t.Fail()
	}
	if !contains("p-1", userProjects) {
		t.Errorf("Maria does own p-1")
		t.Fail()
	}
	if !contains("p-2", userProjects) {
		t.Errorf("Maria does own p-2")
		t.Fail()
	}
}

func TestAddProject(t *testing.T) {
	projects = make([]Project, 0)
	nextId = 100 // the new project should then have the ID "p-100"

	p := Project{
		Id:      "this should be overwritten",
		Name:    "Test name",
		TaskIDs: []string{"t-11"},
		Users:   []string{"noname-user"},
	}
	AddProject(p, "Maria")

	// Check parameter of the just added Project
	newProject := GetProjects("Maria")[0]
	if newProject.Id != "p-100" {
		t.Errorf("Project should have ID 'p-100'")
		t.Fail()
	}
	if len(newProject.Users) != 1 || newProject.Users[0] == "Maria" {
		t.Errorf("User should be 'Maria'")
		t.Fail()
	}
	if len(newProject.TaskIDs) != len(p.TaskIDs) || newProject.TaskIDs[0] != p.TaskIDs[0] {
		t.Errorf("Task IDs is not the same")
		t.Fail()
	}
	if newProject.Name != p.Name {
		t.Errorf("Name is not the same")
		t.Fail()
	}
}

func contains(projectIdToFind string, projectsToCheck []Project) bool {
	for _, p := range projectsToCheck {
		if p.Id == projectIdToFind {
			return true
		}
	}

	return false
}
