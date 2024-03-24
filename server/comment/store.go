package comment

import (
	"database/sql"
	"fmt"
	"github.com/pkg/errors"
	"stm/util"
	"strconv"
	"time"
)

type commentListRow struct {
	Id int // Id of the comment list (referenced by other entities, e.g. tasks).
}

type commentRow struct {
	id            int // Id of the comment itself.
	commentListId int // Id of the comment list this comment belongs to.
	text          string
	authorId      string
	creationDate  *time.Time
}

type storePg struct {
	*util.Logger
	tx               *sql.Tx
	commentListTable string
	commentTable     string
}

func getStore(tx *sql.Tx, logger *util.Logger) *storePg {
	return &storePg{
		Logger:           logger,
		tx:               tx,
		commentListTable: "comment_lists",
		commentTable:     "comments",
	}
}

func (s *storePg) getComments(listId string) ([]Comment, error) {
	rawQueryString := `
SELECT comment.id, comment.text, comment.author_id, comment.creation_date
FROM %s comment_list, %s comment
WHERE
	comment_list.id = $1 AND
	comment_list.id = comment.comment_list_id`

	query := fmt.Sprintf(rawQueryString,
		s.commentListTable,
		s.commentTable)

	s.LogQuery(query, listId)

	rows, err := s.tx.Query(query, listId)
	if err != nil {
		return nil, errors.Wrap(err, "error executing query")
	}
	defer rows.Close()

	comments := make([]Comment, 0)
	for rows.Next() {
		comment, err := rowToComment(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row into comment")
		}

		comments = append(comments, *comment)
	}

	rows.Close()

	return comments, nil
}

// TODO call for new projects and tasks
func (s *storePg) addCommentList(listId string) (string, error) {
	query := fmt.Sprintf("INSERT INTO %s (id) VALUES($1) RETURNING *", s.commentListTable)
	s.LogQuery(query, listId)

	rows, err := s.tx.Query(query, listId)
	if err != nil {
		return "", errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	if err != nil {
		return "", err
	}

	commentListId := ""
	err = rows.Scan(&commentListId)
	if err != nil {
		return "", err
	}

	return commentListId, nil
}

func (s *storePg) addComment(listId string, text string, authorId string, creationDate time.Time) (*Comment, error) {
	query := fmt.Sprintf("INSERT INTO %s (comment_list_id, text, authorId, creation_date) VALUES($1, $2, $3, $4) RETURNING *", s.commentTable)
	comment, err := s.execQuery(query, listId, text, authorId, creationDate)
	if err != nil {
		return nil, err
	}

	return comment, nil
}

// execQuery executed the given query, turns the result into a Comment object and closes the query.
func (s *storePg) execQuery(query string, params ...interface{}) (*Comment, error) {
	s.LogQuery(query, params...)
	rows, err := s.tx.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	rows.Next()
	t, err := rowToComment(rows)

	if t == nil && err == nil {
		return nil, errors.New(fmt.Sprintf("Task does not exist"))
	}

	return t, err
}

// rowToComment turns the current row into a Project object. This does not close the row.
func rowToComment(rows *sql.Rows) (*Comment, error) {
	var c commentRow
	err := rows.Scan(&c.id, &c.text, &c.authorId, &c.creationDate)
	if err != nil {
		return nil, errors.Wrap(err, "could not scan rows")
	}

	result := Comment{}

	result.Id = strconv.Itoa(c.id)
	result.Text = c.text
	result.AuthorId = c.authorId

	if c.creationDate != nil {
		t := c.creationDate.UTC()
		result.CreationDate = &t
	}

	return &result, nil
}
