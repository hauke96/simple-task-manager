package comment

import (
	"fmt"
	"stm/config"
	"stm/util"
	"time"
	"unicode/utf8"

	"github.com/pkg/errors"
)

type Service struct {
	*util.Logger
	store *Store
}

func Init(logger *util.Logger, store *Store) *Service {
	return &Service{
		Logger: logger,
		store:  store,
	}
}

func (s *Service) AddComment(listId string, commentDraft *DraftDto, authorId string) error {
	if utf8.RuneCountInString(commentDraft.Text) > config.Conf.MaxCommentLength {
		return errors.New(fmt.Sprintf("Comment too long. Allowed are %d characters but found %d.", config.Conf.MaxCommentLength, utf8.RuneCountInString(commentDraft.Text)))
	}

	return s.store.addComment(listId, commentDraft.Text, authorId, time.Now().UTC())
}
