package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/lib/pq"
	"github.com/pkg/errors"
	"strconv"
)

// Helper struct to read raw data from database. The "Project" struct has higher-level structure (e.g. arrays), which we
// don't have in the database columns.
type projectRow struct {
	id          int
	name        string
	users       []string
	owner       string
	description string
}

type storePg struct {
	tx        *sql.Tx
	table     string
	taskTable string
}

func getStore(tx *sql.Tx) *storePg {
	return &storePg{
		tx:        tx,
		table:     "projects",
		taskTable: "tasks",
	}
}

func (s *storePg) getProjects(userId string) ([]*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1 = ANY(users)", s.table)

	util.LogQuery(query, userId)

	rows, err := s.tx.Query(query, userId)
	if err != nil {
		return nil, errors.Wrap(err, "error executing query")
	}
	defer rows.Close()

	projects := make([]*Project, 0)
	for rows.Next() {
		project, err := s.rowToProject(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row into project")
		}

		projects = append(projects, project)
	}

	rows.Close()

	// Add task-IDs to projects
	for _, project := range projects {
		err = s.addTaskIdsToProject(project)
		if err != nil {
			return nil, err
		}
	}

	return projects, nil
}

func (s *storePg) getProject(projectId string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1", s.table)
	return s.execQuery(s.tx, query, projectId)
}

func (s *storePg) getProjectByTask(taskId string) (*Project, error) {
	query := fmt.Sprintf("SELECT p.* FROM %s p, %s t WHERE $1 = t.id AND t.project_id = p.id", s.table, s.taskTable)
	return s.execQuery(s.tx, query, taskId)
}

// addProject adds the given project draft and assigns an ID to the project.
func (s *storePg) addProject(draft *Project) (*Project, error) {
	query := fmt.Sprintf("INSERT INTO %s (name, description, users, owner) VALUES($1, $2, $3, $4) RETURNING *", s.table)

	project, err := s.execQuery(s.tx, query, draft.Name, draft.Description, pq.Array(draft.Users), draft.Owner)
	if err != nil {
		return nil, err
	}

	for _, taskId := range draft.TaskIDs {
		query = fmt.Sprintf("INSERT INTO %s (project_id, id) VALUES($1, $2)", s.taskTable)
		err := s.execRawQuery(s.tx, query, project.Id, taskId)
		if err != nil {
			return nil, err
		}
	}

	project.TaskIDs = draft.TaskIDs
	return project, nil
}

func (s *storePg) addUser(projectId string, userIdToAdd string) (*Project, error) {
	originalProject, err := s.getProject(projectId)
	if err != nil {
		sigolo.Error("error getting project with ID '%s'", projectId)
		return nil, err
	}

	newUsers := append(originalProject.Users, userIdToAdd)

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(s.tx, query, pq.Array(newUsers), projectId)
}

func (s *storePg) removeUser(projectId string, userIdToRemove string) (*Project, error) {
	originalProject, err := s.getProject(projectId)
	if err != nil {
		sigolo.Error("error getting project with ID '%s'", projectId)
		return nil, err
	}

	remainingUsers := make([]string, 0)
	for _, u := range originalProject.Users {
		if u != userIdToRemove {
			remainingUsers = append(remainingUsers, u)
		}
	}

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(s.tx, query, pq.Array(remainingUsers), projectId)
}

func (s *storePg) delete(projectId string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", s.table)

	_, err := s.tx.Exec(query, projectId)
	return err
}

func (s *storePg) updateName(projectId string, newName string) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET name=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(s.tx, query, newName, projectId)
}

func (s *storePg) updateDescription(projectId string, newDescription string) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET description=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(s.tx, query, newDescription, projectId)
}

// execQuery executed the given query but doesn't collect any result data. Use "execQuery" to get a proper result.
func (s *storePg) execRawQuery(tx *sql.Tx, query string, params ...interface{}) error {
	util.LogQuery(query, params...)
	rows, err := tx.Query(query, params...)
	if err != nil {
		return errors.Wrap(err, "could not run query")
	}

	err = rows.Close()
	if err != nil {
		return errors.Wrap(err, "could not close row")
	}

	return nil
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func (s *storePg) execQuery(tx *sql.Tx, query string, params ...interface{}) (*Project, error) {
	util.LogQuery(query, params...)
	rows, err := tx.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("there is no next row or an error happened")
	}

	p, err := s.rowToProject(rows)

	// Close row here already to do new queries within "addTaskIdsToProject"
	rows.Close()

	err = s.addTaskIdsToProject(p)
	if err != nil {
		return nil, err
	}

	if p == nil && err == nil {
		return nil, errors.New("Project does not exist")
	}

	return p, err
}

// rowToProject turns the current row into a Project object. This does not close the row.
func (s *storePg) rowToProject(rows *sql.Rows) (*Project, error) {
	var p projectRow
	err := rows.Scan(&p.id, &p.name, &p.owner, &p.description, pq.Array(&p.users))
	if err != nil {
		return nil, errors.Wrap(err, "could not scan rows")
	}

	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.Users = p.users
	result.Owner = p.owner
	result.Description = p.description

	return &result, nil
}

func (s *storePg) addTaskIdsToProject(project *Project) error {
	query := fmt.Sprintf("SELECT ARRAY_AGG(id) FROM %s WHERE project_id = $1", s.taskTable)

	util.LogQuery(query, project.Id)
	rows, err := s.tx.Query(query, project.Id)
	if err != nil {
		return errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	ok := rows.Next()
	if !ok {
		return errors.New("there is no next row or an error happened")
	}

	err = rows.Scan(pq.Array(&project.TaskIDs))
	if err != nil {
		return errors.Wrap(err, "could not scan task IDs from row")
	}

	sigolo.Info("Added task-IDs to project %s", project.Id)

	return nil
}
