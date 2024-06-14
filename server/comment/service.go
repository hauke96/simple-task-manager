package comment

import (
	"database/sql"
	"fmt"
	"github.com/pkg/errors"
	"stm/config"
	"stm/util"
	"time"
)

type Service struct {
	*util.Logger
	store *Store
}

func Init(tx *sql.Tx, logger *util.Logger, store *Store) *Service {
	return &Service{
		Logger: logger,
		store:  store,
	}
}

func (s *Service) AddComment(listId string, commentDraft *DraftDto, authorId string) error {
	if len(commentDraft.Text) > config.Conf.MaxCommentLength {
		return errors.New(fmt.Sprintf("Comment too long. Allowed are %d characters but found %d.", config.Conf.MaxCommentLength, len(commentDraft.Text)))
	}

	return s.store.addComment(listId, commentDraft.Text, authorId, time.Now().UTC())
}
