package comment

import (
	"database/sql"
	"fmt"
	"github.com/pkg/errors"
	"stm/config"
	"stm/util"
	"time"
)

type CommentService struct {
	*util.Logger
	store *CommentStore
}

func Init(tx *sql.Tx, logger *util.Logger, store *CommentStore) *CommentService {
	return &CommentService{
		Logger: logger,
		store:  store,
	}
}

func (s *CommentService) AddComment(listId string, commentDraft *CommentDraftDto, authorId string) error {
	if len(commentDraft.Text) > config.Conf.MaxCommentLength {
		return errors.New(fmt.Sprintf("Comment too long. Allowed are %d characters but found %d.", config.Conf.MaxCommentLength, len(commentDraft.Text)))
	}

	return s.store.addComment(listId, commentDraft.Text, authorId, time.Now().UTC())
}
