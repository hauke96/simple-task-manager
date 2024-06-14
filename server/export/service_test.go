package export

import (
	"database/sql"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"
	"stm/comment"
	"stm/config"
	"stm/permission"
	"stm/project"
	"stm/task"
	"stm/test"
	"stm/util"
	"testing"
	"time"
)

var (
	tx *sql.Tx
	s  *Service
	h  *test.Helper
)

func TestMain(m *testing.M) {
	h = test.NewTestHelper(setup)
	m.Run()
}

func setup() {
	sigolo.LogLevel = sigolo.LOG_DEBUG
	config.LoadConfig("../test/test-config.json")
	h.InitWithDummyData(config.Conf.DbUsername, config.Conf.DbPassword, config.Conf.DbDatabase)
	tx = h.NewTransaction()

	logger := util.NewLogger()

	permissionStore := permission.Init(tx, logger)
	commentStore := comment.GetStore(tx, logger)
	commentService := comment.Init(tx, logger, commentStore)
	taskService := task.Init(tx, logger, permissionStore, commentService, commentStore)
	projectService := project.Init(tx, logger, taskService, permissionStore, commentService, commentStore)

	s = Init(logger, projectService)
}

func TestGetProjectExport(t *testing.T) {
	h.Run(t, func() error {
		result, err := s.ExportProject("2", "Anna")
		if err != nil {
			return err
		}

		if result.Name != "Project 2" {
			return errors.New("Project name not matching")
		}
		if len(result.Users) != 6 {
			return errors.New("Number of users not matching")
		}
		if *result.CreationDate != time.Date(2021, 2, 13, 5, 16, 55, 150015000, time.UTC) {
			return errors.New("Project creationDate not matching")
		}
		if result.Description != "This is a very important project!" {
			return errors.New("Project description not matching")
		}
		if result.Owner != "Maria" {
			return errors.New("Project description not matching")
		}
		if len(result.Tasks) != 5 {
			return errors.New("Number of tasks not matching")
		}

		return nil
	})
}

func TestImportProject(t *testing.T) {
	h.Run(t, func() error {
		// Arrange
		task := &TaskExport{
			Name:             "task 1",
			ProcessPoints:    33,
			MaxProcessPoints: 120,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0.00008929616120192039,0.0004811765447811922],[0.00008929616120192039,0.00048118462350998925],[0.00008930976265082209,0.00048118462350998925],[0.00008930976265082209,0.0004811765447811922],[0.00008929616120192039,0.0004811765447811922]]]},\"properties\":null}",
			AssignedUser:     "345",
		}

		time := time.Date(2021, 2, 13, 5, 16, 55, 150015000, time.UTC)
		projectExport := &ProjectExport{
			Name:         "Test project",
			Users:        []string{"123", "345"},
			Owner:        "123",
			Description:  "foo",
			CreationDate: &time,
			Tasks:        []*TaskExport{task},
		}

		// Act
		result, err := s.ImportProject(projectExport, "123")

		// Assert
		if err != nil {
			return err
		}

		if result.Name != "Test project" {
			return errors.New("Project name not matching")
		}
		if len(result.Users) != 2 {
			return errors.New("Number of users not matching")
		}
		if *result.CreationDate == time {
			return errors.New("Project creationDate should not be the original one")
		}
		if result.Description != "foo" {
			return errors.New("Project description not matching")
		}
		if result.Owner != "123" {
			return errors.New("Project description not matching")
		}
		if len(result.Tasks) != 1 {
			return errors.New("Number of tasks not matching")
		}

		return nil
	})
}

func TestImportProjectByDifferentUser(t *testing.T) {
	h.Run(t, func() error {
		// Arrange
		task := &TaskExport{
			Name:             "task 1",
			ProcessPoints:    33,
			MaxProcessPoints: 120,
			Geometry:         "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[0.00008929616120192039,0.0004811765447811922],[0.00008929616120192039,0.00048118462350998925],[0.00008930976265082209,0.00048118462350998925],[0.00008930976265082209,0.0004811765447811922],[0.00008929616120192039,0.0004811765447811922]]]},\"properties\":null}",
			AssignedUser:     "345",
		}

		projectExport := &ProjectExport{
			Name:  "Test project",
			Users: []string{"123", "345"},
			Owner: "123",
			Tasks: []*TaskExport{task},
		}

		requestingUserId := "42"

		// Act
		result, err := s.ImportProject(projectExport, requestingUserId)

		// Assert
		if err != nil {
			return err
		}

		if len(result.Users) != 3 {
			return errors.New("Number of users not matching")
		}
		if result.Users[0] != requestingUserId &&
			result.Users[1] != requestingUserId &&
			result.Users[2] != requestingUserId {
			return errors.New("Requesting user not member of imported project")
		}

		return nil
	})
}
