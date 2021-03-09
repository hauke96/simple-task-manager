package export

import (
	"database/sql"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/test"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/pkg/errors"
	"testing"
	"time"
)

var (
	tx *sql.Tx
	s  *ExportService
	p  *project.ProjectService
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
	taskService := task.Init(tx, logger, permissionService)
	projectService := project.Init(tx, logger, taskService, permissionService)

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
