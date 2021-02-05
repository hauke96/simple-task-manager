package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/test"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/pkg/errors"
	"testing"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

var (
	tx          *sql.Tx
	s           *ProjectService
	taskService *task.TaskService
	h           *test.TestHelper
)

func TestMain(m *testing.M) {
	h = &test.TestHelper{
		Setup: setup,
	}

	m.Run()
}

func setup() {
	config.LoadConfig("../config/test.json")
	test.InitWithDummyData()
	sigolo.LogLevel = sigolo.LOG_DEBUG

	logger := util.NewLogger()

	var err error
	tx, err = database.GetTransaction(logger)
	if err != nil {
		panic(err)
	}

	h.Tx = tx
	permissionService := permission.Init(tx, logger)
	taskService = task.Init(tx, logger, permissionService)
	s = Init(tx, logger, taskService, permissionService)
}

func TestGetProjects(t *testing.T) {
	h.Run(t, func() error {
		// For Maria (being part of project 1 and 2)
		userProjects, err := s.GetProjects("Maria")
		if err != nil {
			return err
		}
		if !contains("1", userProjects) {
			return errors.New("Maria is in deed project 1")
		}
		if !contains("2", userProjects) {
			return errors.New("Maria is in deed project 2")
		}
		if userProjects[0].TotalProcessPoints != 10 || userProjects[0].DoneProcessPoints != 0 {
			return errors.New("Process points on project not set correctly")
		}
		if userProjects[1].TotalProcessPoints != 308 || userProjects[1].DoneProcessPoints != 154 {
			return errors.New("Process points on project not set correctly")
		}
		if len(userProjects[0].Tasks) != 1 || userProjects[0].Tasks[0].Id != "1" {
			return errors.New("Tasks of project 1 not matching")
		}
		if len(userProjects[1].Tasks) != 5 ||
			userProjects[1].Tasks[0].Id != "2" ||
			userProjects[1].Tasks[1].Id != "3" ||
			userProjects[1].Tasks[2].Id != "4" ||
			userProjects[1].Tasks[3].Id != "6" ||
			userProjects[1].Tasks[4].Id != "7" {
			return errors.New("Tasks of project 1 not matching")
		}

		// For Peter (being part of only project 1)
		userProjects, err = s.GetProjects("Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("Getting should work: %+v", err))
		}
		if !contains("1", userProjects) {
			return errors.New("Peter is in deed project 1")
		}
		if contains("2", userProjects) {
			return errors.New("Peter is not in project 2")
		}
		if userProjects[0].TotalProcessPoints != 10 || userProjects[0].DoneProcessPoints != 0 {
			return errors.New("Process points on project not set correctly")
		}

		return nil
	})
}

func TestGetProjectsInvalidUser(t *testing.T) {
	h.Run(t, func() error {
		// User "Worf" does not exist
		projects, err := s.GetProjects("Worf")
		if err != nil {
			return errors.New("Getting projects for 'Worf' should work")
		}
		if len(projects) != 0 {
			return errors.New("User 'Worf' has no project")
		}

		// This should not fail but should also not return anything
		projects, err = s.GetProjects("")
		if err != nil {
			return errors.New("Getting projects for empty user should work")
		}
		if len(projects) != 0 {
			return errors.New("Empty user has no project")
		}

		return nil
	})
}

func TestGetProjectByTask(t *testing.T) {
	h.Run(t, func() error {
		project, err := s.GetProjectByTask("4")
		if err != nil {
			return err
		}

		if project.Id != "2" {
			return errors.New("Project ID not matching")
		}
		if project.TotalProcessPoints != 308 || project.DoneProcessPoints != 154 {
			return errors.New("Process points on project not set correctly")
		}
		return nil
	})
}

func TestAddWithTasks(t *testing.T) {
	h.Run(t, func() error {
		user := "Jack"
		p := ProjectDraftDto{
			Name:  "Test name",
			Users: []string{user, "user2"},
			Owner: user,
		}

		t := task.TaskDraftDto{
			MaxProcessPoints: 100,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,0]]]},\"properties\":null}",
		}

		newProject, err := s.AddProjectWithTasks(&p, []task.TaskDraftDto{t})
		if err != nil {
			return errors.New(fmt.Sprintf("Adding should work: %s", err.Error()))
		}

		// Check project

		if len(newProject.Users) != 2 {
			return errors.New(fmt.Sprintf("User amount should be 2 but was %d", len(newProject.Users)))
		}
		if newProject.Users[0] != user || newProject.Users[1] != "user2" {
			return errors.New("User not matching")
		}
		if newProject.Name != p.Name {
			return errors.New(fmt.Sprintf("Name should be '%s' but was '%s'", newProject.Name, p.Name))
		}
		if newProject.Owner != user {
			return errors.New(fmt.Sprintf("Owner should be '%s' but was '%s'", user, newProject.Owner))
		}
		if newProject.TotalProcessPoints != 100 {
			return errors.New("Process points on project not set correctly")
		}

		// Check task

		tasks := newProject.Tasks
		if tasks == nil || len(tasks) != 1 {
			return errors.New("Expect to have exactly one task")
		}

		task := tasks[0]
		if task.AssignedUser != "" ||
			task.MaxProcessPoints != t.MaxProcessPoints ||
			task.Geometry != t.Geometry ||
			task.ProcessPoints != 0 {
			return errors.New(fmt.Sprintf("Added task does not match:\n%v\n%v\n", t, task))
		}

		return nil
	})
}

func TestAddAndGetProject(t *testing.T) {
	h.Run(t, func() error {
		user := "Jack"
		p := ProjectDraftDto{
			Name:  "Test name",
			Users: []string{user, "user2"},
			Owner: user,
		}

		newProject, err := s.AddProject(&p)
		if err != nil {
			return errors.New(fmt.Sprintf("Adding should work: %s", err.Error()))
		}

		if len(newProject.Users) != 2 {
			return errors.New(fmt.Sprintf("User amount should be 2 but was %d", len(newProject.Users)))
		}
		if newProject.Users[0] != user || newProject.Users[1] != "user2" {
			return errors.New(fmt.Sprintf("User not matching"))
		}
		if newProject.Name != p.Name {
			return errors.New(fmt.Sprintf("Name should be '%s' but was '%s'", newProject.Name, p.Name))
		}
		if newProject.Owner != user {
			return errors.New(fmt.Sprintf("Owner should be '%s' but was '%s'", user, newProject.Owner))
		}
		return nil
	})
}

func TestAddProjectWithInvalidParameters(t *testing.T) {
	h.Run(t, func() error {
		// Owner must be set
		p := ProjectDraftDto{
			Owner: "",
		}
		_, err := s.AddProject(&p)
		if err == nil {
			return errors.New("adding project without owner not allowed")
		}

		// Owner must be in users array
		p = ProjectDraftDto{
			Owner: "foo",
			Users: []string{"bar"},
		}
		_, err = s.AddProject(&p)
		if err == nil {
			return errors.New("adding project with owner not in users array not allowed")
		}

		// Name must be set
		p = ProjectDraftDto{
			Owner: "foo",
			Users: []string{"foo"},
			Name:  "",
		}
		_, err = s.AddProject(&p)
		if err == nil {
			return errors.New("adding project without name not allowed")
		}

		// Too long description not allowed
		maxDescriptionLength = 10 // lower the border for test purposes
		p = ProjectDraftDto{
			Owner:       "foo",
			Users:       []string{"foo"},
			Name:        "some name",
			Description: "This is a very very long description",
		}
		_, err = s.AddProject(&p)
		if err == nil {
			return errors.New("adding project with too long description not allowed")
		}

		return nil
	})
}

func TestAddUser(t *testing.T) {
	h.Run(t, func() error {
		newUser := "new user"

		p, err := s.AddUser("1", newUser, "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("This should work: %s", err.Error()))
		}

		containsUser := false
		for _, u := range p.Users {
			if u == newUser {
				containsUser = true
				break
			}
		}
		if !containsUser {
			return errors.New("Project should contain new user")
		}
		if p.TotalProcessPoints != 10 || p.DoneProcessPoints != 0 {
			return errors.New(fmt.Sprintf("Process points on project not set correctly"))
		}

		p, err = s.AddUser("2284527", newUser, "Peter")
		if err == nil {
			return errors.New("This should not work: The project does not exist")
		}

		p, err = s.AddUser("1", newUser, "Not-Owning-User")
		if err == nil {
			return errors.New("This should not work: A non-owner user tries to add a user")
		}
		return nil
	})
}

func TestAddUserTwice(t *testing.T) {
	h.Run(t, func() error {
		newUser := "another-new-user"

		_, err := s.AddUser("1", newUser, "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("This should work: %s", err.Error()))
		}

		// Add second time, this should now work
		_, err = s.AddUser("1", newUser, "Peter")
		if err == nil {
			return errors.New("Adding a user twice should not work")
		}
		return nil
	})
}

func TestRemoveUser(t *testing.T) {
	h.Run(t, func() error {
		userToRemove := "Maria"

		p, err := s.RemoveUser("1", "Peter", userToRemove)
		if err != nil {
			return errors.New(fmt.Sprintf("This should work: %s", err.Error()))
		}

		containsUser := false
		for _, u := range p.Users {
			if u == userToRemove {
				containsUser = true
				break
			}
		}
		if containsUser {
			return errors.New("Project should not contain user anymore")
		}
		if p.TotalProcessPoints != 10 || p.DoneProcessPoints != 0 {
			return errors.New(fmt.Sprintf("Process points on project not set correctly"))
		}

		tasks := p.Tasks

		// Check that the user to remove has been unassigned
		for _, task := range tasks {
			if task.AssignedUser == userToRemove {
				return errors.New(fmt.Sprintf("Task '%s' still has user '%s' assigned", task.Id, userToRemove))
			}
		}

		// Not existing project
		p, err = s.RemoveUser("2284527", "Peter", userToRemove)
		if err == nil {
			return errors.New("This should not work: The project does not exist")
		}

		// Not owning user requesting removal
		p, err = s.RemoveUser("1", "Not-Owning-User", userToRemove)
		if err == nil {
			return errors.New("This should not work: A non-owner user requests removal")
		}
		return nil
	})
}

func TestRemoveNonOwnerUser(t *testing.T) {
	h.Run(t, func() error {
		userToRemove := "Carl"

		// Carl is not owner and removes himself, which is ok
		p, err := s.RemoveUser("2", "Carl", userToRemove)
		if err != nil {
			return errors.New(fmt.Sprintf("This should work: %s", err.Error()))
		}

		containsUser := false
		for _, u := range p.Users {
			if u == userToRemove {
				containsUser = true
				break
			}
		}
		if containsUser {
			return errors.New("Project should not contain user anymore")
		}
		return nil
	})
}

func TestRemoveArbitraryUserNotAllowed(t *testing.T) {
	h.Run(t, func() error {
		userToRemove := "Anna"

		// Michael is not member of the project and should not be allowed to remove anyone
		p, err := s.RemoveUser("2", "Michael", userToRemove)
		if err == nil {
			return errors.New(fmt.Sprintf("This should not work: %s", err.Error()))
		}

		p, err = s.GetProject("2", "Maria")
		if err != nil {
			return err
		}

		containsUser := false
		for _, u := range p.Users {
			if u == userToRemove {
				containsUser = true
				break
			}
		}
		if !containsUser {
			return errors.New("Project should still contain user")
		}

		// Remove not-member user:

		userToRemove = "Nina" // Not a member of the project
		p, err = s.RemoveUser("2", "Peter", userToRemove)
		if err == nil {
			return errors.New(fmt.Sprintf("This should not work: %s", err.Error()))
		}
		return nil
	})
}

func TestRemoveUserTwice(t *testing.T) {
	h.Run(t, func() error {
		_, err := s.RemoveUser("2", "Maria", "John")
		if err != nil {
			t.Error("This should work: ", err)
		}

		// "John" was removed above to we remove him here the second time
		_, err = s.RemoveUser("2", "Maria", "John")
		if err == nil {
			return errors.New("Removing a user twice should not work")
		}
		return nil
	})
}

func TestRemoveUserUnassignsHim(t *testing.T) {
	h.Run(t, func() error {
		p, err := s.RemoveUser("2", "Donny", "Donny")
		if err != nil {
			return errors.New("Removing user should work")
		}

		tasks := p.Tasks
		// No task should be assigned to "Donny"
		for _, t := range tasks {
			if t.AssignedUser == "Donny" {
				return errors.New(fmt.Sprintf("User %s still assigned to task %s", "Donny", t.Id))
			}
		}

		return nil
	})
}

func TestRemoveOwnerNotAllowed(t *testing.T) {
	h.Run(t, func() error {
		_, err := s.RemoveUser("2", "Maria", "Maria")
		if err == nil {
			return errors.New("removing owner not allowed")
		}

		return nil
	})
}

func TestRemoveDifferentUserNotAllowed(t *testing.T) {
	h.Run(t, func() error {
		_, err := s.RemoveUser("2", "Donny", "Anna")
		if err == nil {
			return errors.New("removing other user not allowed")
		}

		return nil
	})
}

func TestDeleteProject(t *testing.T) {
	h.Run(t, func() error {
		id := "1" // owned by "Peter"

		// Try to remove with now-owning user

		err := s.DeleteProject(id, "Maria") // Maria does not own this project
		if err == nil {
			return errors.New("Maria does not own this project, this should not work")
		}

		_, err = s.GetProject(id, "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("The project should exist: %s", err.Error()))
		}

		// Actually remove project

		err = s.DeleteProject(id, "Peter") // Maria does not own this project
		if err != nil {
			return errors.New(fmt.Sprintf("Peter owns this project, this should work: %s", err.Error()))
		}

		_, err = s.GetProject(id, "Peter")
		if err == nil {
			return errors.New("The project should not exist anymore")
		}

		_, err = s.store.taskStore.GetTasks(id)
		if err == nil {
			return errors.New("The tasks should not exist anymore")
		}

		// Delete not existing project

		err = s.DeleteProject("45356475", "Peter")
		if err == nil {
			return errors.New("This project does not exist, this should not work")
		}
		return nil
	})
}

func TestUpdateName(t *testing.T) {
	h.Run(t, func() error {
		oldProject, err := s.GetProject("1", "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("Error getting project to update: %s", err))
		}

		newName := "flubby dubby"
		project, err := s.UpdateName("1", newName, "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("Error updating name wasn't expected: %s", err))
		}
		if project.Name != newName {
			return errors.New(fmt.Sprintf("New name doesn't match with expected one: %s != %s", oldProject.Name, newName))
		}
		if project.TotalProcessPoints != 10 || project.DoneProcessPoints != 0 {
			return errors.New(fmt.Sprintf("Process points on project not set correctly"))
		}

		// With newline

		newNewlineName := "foo\nbar\nwhatever"
		project, err = s.UpdateName("1", newNewlineName, "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("Error updating name wasn't expected: %s", err))
		}
		if project.Name != "foo" {
			return errors.New(fmt.Sprintf("New name doesn't match with expected one: %s != foo", oldProject.Name))
		}

		// With non-owner (Maria)

		_, err = s.UpdateName("1", "skfgkf", "Maria")
		if err == nil {
			return errors.New("Updating name should not be possible for non-owner user Maria")
		}

		// Empty name

		_, err = s.UpdateName("1", "  ", "Peter")
		if err == nil {
			return errors.New("Updating name should not be possible with empty name")
		}
		return nil
	})
}

func TestUpdateDescription(t *testing.T) {
	h.Run(t, func() error {
		oldProject, _ := s.GetProject("1", "Peter")

		newDescription := "flubby dubby\n foo bar"
		project, err := s.UpdateDescription("1", newDescription, "Peter")
		if err != nil {
			return errors.New(fmt.Sprintf("Error updating description wasn't expected: %s", err))
		}
		if project.Description != newDescription {
			return errors.New(fmt.Sprintf("New description doesn't match with expected one: %s != %s", oldProject.Name, newDescription))
		}
		if project.TotalProcessPoints != 10 || project.DoneProcessPoints != 0 {
			return errors.New(fmt.Sprintf("Process points on project not set correctly"))
		}

		// With non-owner (Maria)

		_, err = s.UpdateDescription("1", "skfgkf", "Maria")
		if err == nil {
			return errors.New("Updating description should not be possible for non-owner user Maria")
		}

		// Empty description

		_, err = s.UpdateDescription("1", "  ", "Peter")
		if err == nil {
			return errors.New("Updating description should not be possible with empty description")
		}
		return nil
	})
}

func contains(projectIdToFind string, projectsToCheck []*Project) bool {
	for _, p := range projectsToCheck {
		if p.Id == projectIdToFind {
			return true
		}
	}

	return false
}
