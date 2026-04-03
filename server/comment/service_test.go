package comment

import (
	"database/sql"
	"stm/config"
	"stm/test"
	"stm/util"
	"testing"

	"github.com/hauke96/sigolo"
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

	s = Init(logger, GetStore(tx, logger))
}

func TestAddCommentWithUnicodeCharacters(t *testing.T) {
	h.Run(t, func() error {
		commentListId, err := s.store.NewCommentList()
		if err != nil {
			return err
		}

		config.Conf.MaxCommentLength = 10

		dto := &DraftDto{Text: "foo bar →→"} // 10 characters but more than 10 bytes

		err = s.AddComment(commentListId, dto, "User")
		return err
	})
}
