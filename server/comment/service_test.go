package comment

import (
	"database/sql"
	"github.com/hauke96/sigolo"
	"github.com/pkg/errors"
	"stm/config"
	"stm/test"
	"stm/util"
	"testing"
)

var (
	tx *sql.Tx
	s  *CommentService
	h  *test.TestHelper
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

	s = Init(tx, logger)
}

func TestGetProjects(t *testing.T) {
	h.Run(t, func() error {
		comments, err := s.GetComments("2")
		if err != nil {
			return err
		}

		if len(comments) != 2 {
			return errors.Errorf("Expected %d comment for project %d but found %d", 3, 1, len(comments))
		}

		if comments[0].Id != "1" {
			return errors.Errorf("Expected comment ID %s but got %s", "1", comments[0].Id)
		}
		if comments[1].Id != "2" {
			return errors.Errorf("Expected comment ID %s but got %s", "2", comments[1].Id)
		}

		return nil
	})
}
