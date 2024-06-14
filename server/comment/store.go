package comment

import (
	"database/sql"
	"fmt"
	"github.com/pkg/errors"
	"stm/util"
	"strconv"
	"time"
)

type commentRow struct {
	id            int // Id of the comment itself.
	commentListId int // Id of the comment list this comment belongs to.
	text          string
	authorId      string
	creationDate  *time.Time
}

type Store struct {
	*util.Logger
	tx               *sql.Tx
	commentListTable string
	commentTable     string
}

func GetStore(tx *sql.Tx, logger *util.Logger) *Store {
	return &Store{
		Logger:           logger,
		tx:               tx,
		commentListTable: "comment_lists",
		commentTable:     "comments",
	}
}

func (s *Store) GetComments(listId string) ([]Comment, error) {
	rawQueryString := `
SELECT comment.*
FROM %s comment_list, %s comment
WHERE
	comment_list.id = $1 AND
	comment_list.id = comment.comment_list_id;`

	query := fmt.Sprintf(rawQueryString, s.commentListTable, s.commentTable)
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

func (s *Store) NewCommentList() (string, error) {
	query := fmt.Sprintf("INSERT INTO %s DEFAULT VALUES RETURNING id", s.commentListTable)
	s.LogQuery(query)

	rows, err := s.tx.Query(query)
	if err != nil {
		return "", errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	if !rows.Next() {
		return "", errors.New("there is no next row or an error happened")
	}

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

func (s *Store) addComment(listId string, text string, authorId string, creationDate time.Time) error {
	query := fmt.Sprintf("INSERT INTO %s (comment_list_id, text, author_id, creation_date) VALUES($1, $2, $3, $4) RETURNING *", s.commentTable)
	_, err := s.execQuery(query, listId, text, authorId, creationDate)
	return err
}

// execQuery executed the given query, turns the result into a Comment object and closes the query.
func (s *Store) execQuery(query string, params ...interface{}) (*Comment, error) {
	s.LogQuery(query, params...)
	rows, err := s.tx.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("there is no next row or an error happened")
	}

	t, err := rowToComment(rows)

	if t == nil && err == nil {
		return nil, errors.New(fmt.Sprintf("Task does not exist"))
	}

	return t, err
}

// rowToComment turns the current row into a Project object. This does not close the row.
func rowToComment(rows *sql.Rows) (*Comment, error) {
	var c commentRow
	err := rows.Scan(&c.commentListId, &c.id, &c.text, &c.creationDate, &c.authorId)
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
