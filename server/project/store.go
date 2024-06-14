package project

import (
	"database/sql"
	"fmt"
	"github.com/lib/pq"
	"github.com/pkg/errors"
	"stm/comment"
	"stm/task"
	"stm/util"
	"strconv"
	"time"
)

// Helper struct to read raw data from database. The "Project" struct has higher-level structure (e.g. arrays), which we
// don't have in the database columns.
type projectRow struct {
	id             int
	name           string
	users          []string
	owner          string
	description    string
	creationDate   *time.Time
	commentListId  string
	josmDataSource JosmDataSource
}

type storePg struct {
	*util.Logger
	tx           *sql.Tx
	table        string
	taskStore    *task.StorePg
	commentStore *comment.CommentStore
}

func getStore(tx *sql.Tx, logger *util.Logger, taskStore *task.StorePg, commentStore *comment.CommentStore) *storePg {
	return &storePg{
		Logger:       logger,
		tx:           tx,
		table:        "projects",
		taskStore:    taskStore,
		commentStore: commentStore,
	}
}

func (s *storePg) getAllProjectsOfUser(userId string) ([]*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1 = ANY(users)", s.table)

	s.LogQuery(query, userId)

	rows, err := s.tx.Query(query, userId)
	if err != nil {
		return nil, errors.Wrap(err, "error executing query")
	}

	projects := make([]*Project, 0)
	projectRows := make([]*projectRow, 0)
	for rows.Next() {
		project, projectRow, err := s.rowToProject(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row into project")
		}

		projects = append(projects, project)
		projectRows = append(projectRows, projectRow)
	}

	err = rows.Close()
	if err != nil {
		return nil, err
	}

	// Add task-IDs and comments to projects
	for i, project := range projects {
		err = s.addTasksToProject(project)
		if err != nil {
			return nil, err
		}

		err = s.addCommentsToProject(project, projectRows[i])
		if err != nil {
			return nil, err
		}
	}

	return projects, nil
}

func (s *storePg) getProject(projectId string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1", s.table)
	return s.execQuery(query, projectId)
}

func (s *storePg) getProjectOfTask(taskId string) (*Project, error) {
	query := fmt.Sprintf("SELECT p.* FROM %s p, %s t WHERE $1 = t.id AND t.project_id = p.id", s.table, s.taskStore.Table)
	return s.execQuery(query, taskId)
}

// addProject adds the given project draft and assigns an ID to the project.
func (s *storePg) addProject(draft *ProjectDraftDto, creationDate time.Time) (*Project, error) {
	commentListId, err := s.commentStore.NewCommentList()
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf("INSERT INTO %s (name, description, users, owner, creation_date, comment_list_id, josm_data_source) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *", s.table)
	params := []interface{}{draft.Name, draft.Description, pq.Array(draft.Users), draft.Owner, creationDate, commentListId, draft.JosmDataSource}

	s.LogQuery(query, params...)
	project, _, err := s.execQueryWithoutTasks(query, params...)
	if err != nil {
		return nil, err
	}

	// No need to fetch anything, a new project always has an empty comment list
	project.Comments = []comment.Comment{}

	return project, nil
}

func (s *storePg) addUser(projectId string, userIdToAdd string) (*Project, error) {
	originalProject, err := s.getProject(projectId)
	if err != nil {
		s.Err("error getting project with ID '%s'", projectId)
		return nil, err
	}

	newUsers := append(originalProject.Users, userIdToAdd)

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(query, pq.Array(newUsers), projectId)
}

func (s *storePg) removeUser(projectId string, userIdToRemove string) (*Project, error) {
	originalProject, err := s.getProject(projectId)
	if err != nil {
		s.Err("error getting project with ID '%s'", projectId)
		return nil, err
	}

	remainingUsers := make([]string, 0)
	for _, u := range originalProject.Users {
		if u != userIdToRemove {
			remainingUsers = append(remainingUsers, u)
		}
	}

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(query, pq.Array(remainingUsers), projectId)
}

func (s *storePg) delete(projectId string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", s.table)

	_, err := s.tx.Exec(query, projectId)
	return err
}

func (s *storePg) update(projectId string, newName string, newDescription string, newJosmDataSource JosmDataSource) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET name=$2, description=$3, josm_data_source=$4 WHERE id=$1 RETURNING *", s.table)
	return s.execQuery(query, projectId, newName, newDescription, newJosmDataSource)
}

func (s *storePg) getCommentListId(projectId string) (string, error) {
	query := fmt.Sprintf("SELECT comment_list_id FROM %s WHERE id = $1;", s.table)
	s.LogQuery(query, projectId)

	rows, err := s.tx.Query(query, projectId)
	if err != nil {
		return "", errors.Wrapf(err, "error executing query to get comment list id for project %s", projectId)
	}
	defer rows.Close()

	if !rows.Next() {
		return "", errors.New("there is no next row or an error happened")
	}

	commentListId := ""
	err = rows.Scan(&commentListId)
	if err != nil {
		return "", errors.Wrap(err, "could not scan row for comment list id")
	}

	return commentListId, nil
}

func (s *storePg) execQueryWithoutTasks(query string, params ...interface{}) (*Project, *projectRow, error) {
	rows, err := s.tx.Query(query, params...)
	if err != nil {
		return nil, nil, errors.Wrap(err, "could not run query")
	}

	if !rows.Next() {
		return nil, nil, errors.New("there is no next row or an error happened")
	}

	project, projectRow, err := s.rowToProject(rows)
	if project == nil && err == nil {
		return nil, nil, errors.New("Project does not exist")
	}

	err = rows.Close()
	if err != nil {
		return nil, nil, err
	}

	return project, projectRow, err
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func (s *storePg) execQuery(query string, params ...interface{}) (*Project, error) {
	s.LogQuery(query, params...)

	project, projectRow, err := s.execQueryWithoutTasks(query, params...)
	if err != nil {
		return nil, err
	}

	err = s.addTasksToProject(project)
	if err != nil {
		return nil, err
	}

	err = s.addCommentsToProject(project, projectRow)
	if err != nil {
		return nil, err
	}

	return project, err
}

// rowToProject turns the current row into a Project object. This does not close the row.
func (s *storePg) rowToProject(rows *sql.Rows) (*Project, *projectRow, error) {
	var row projectRow
	err := rows.Scan(&row.id, &row.name, &row.owner, &row.description, pq.Array(&row.users), &row.creationDate, &row.commentListId, &row.josmDataSource)
	if err != nil {
		return nil, nil, errors.Wrap(err, "could not scan rows")
	}

	result := Project{}

	result.Id = strconv.Itoa(row.id)
	result.Name = row.name
	result.Users = row.users
	result.Owner = row.owner
	result.Description = row.description
	result.JosmDataSource = row.josmDataSource

	if row.creationDate != nil {
		t := row.creationDate.UTC()
		result.CreationDate = &t
	}

	return &result, &row, nil
}

func (s *storePg) addTasksToProject(project *Project) error {
	tasks, err := s.taskStore.GetAllTasksOfProject(project.Id)
	if err != nil {
		return err
	}

	project.Tasks = tasks
	s.Log("Added tasks to project %s", project.Id)

	return nil
}

func (s *storePg) addCommentsToProject(project *Project, projectRow *projectRow) error {
	comments, err := s.commentStore.GetComments(projectRow.commentListId)
	if err != nil {
		return err
	}
	project.Comments = comments
	return nil
}
