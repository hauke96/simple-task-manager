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
	store *storePg
}

func Init(tx *sql.Tx, logger *util.Logger) *CommentService {
	return &CommentService{
		Logger: logger,
		store:  getStore(tx, logger),
	}
}

func (s *CommentService) GetComments(listId string) ([]Comment, error) {
	return s.store.getComments(listId)
}

func (s *CommentService) AddComment(listId string, commentDraft *CommentDraftDto, authorId string) (*Comment, error) {
	if len(commentDraft.Text) > config.Conf.MaxCommentLength {
		return nil, errors.New(fmt.Sprintf("Comment too long. Allowed are %d characters but found %d.", config.Conf.MaxCommentLength, len(commentDraft.Text)))
	}

	return s.store.addComment(listId, commentDraft.Text, authorId, time.Now().UTC())
}
