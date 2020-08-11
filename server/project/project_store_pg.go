package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/task"
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
	taskIds     []string
	users       []string
	owner       string
	description string
}

type storePg struct {
	tx            *sql.Tx
	table         string
	relationTable string
}

func getStore(tx *sql.Tx) *storePg {
	return &storePg{
		tx:            tx,
		table:         "projects",
		relationTable: "project_tasks",
	}
}

func (s *storePg) getProjects(userId string) ([]*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1=ANY(users)", s.table)

	util.LogQuery(query, userId)

	rows, err := s.tx.Query(query, userId)
	if err != nil {
		return nil, errors.Wrap(err, "error executing query")
	}

	projects := make([]*Project, 0)
	for rows.Next() {
		project, err := s.rowToProject(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row into project")
		}

		projects = append(projects, project)
	}

	return projects, nil
}

func (s *storePg) getProject(projectId string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1", s.table)
	return s.execQuery(s.tx, query, projectId)
}

func (s *storePg) getProjectByTask(taskId string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1=ANY(task_ids)", s.table)
	return s.execQuery(s.tx, query, taskId)
}

// areTasksUsed checks whether any of the given tasks is already part of a project. Returns false and an error in case
// of an error.
func (s *storePg) areTasksUsed(taskIds []string) (bool, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE task_id = $1", s.relationTable)

	util.LogQuery(query, taskIds)
	rows, err := s.tx.Query(query, pq.Array(taskIds))
	if err != nil {
		return false, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	ok := rows.Next()
	if !ok {
		return false, errors.New("there is no next row or an error happened")
	}

	var count int
	err = rows.Scan(&count)
	if err != nil {
		return false, errors.Wrap(err, "could not scan count from rows")
	}

	return count != 0, nil
}

// Adds the given project draft and assigns an ID to the project
func (s *storePg) addProject(draft *Project) (*Project, error) {
	query := fmt.Sprintf("INSERT INTO %s (name, description, users, owner) VALUES($1, $2, $3, $4) RETURNING *", s.table)

	project, err := s.execQuery(s.tx, query, draft.Name, draft.Description, pq.Array(draft.Users), draft.Owner)
	if err != nil {
		return nil, err
	}

	for _, taskId := range draft.TaskIDs {
		query = fmt.Sprintf("INSERT INTO %s (project_id, task_id) VALUES($1, $2)", s.relationTable)
		s.execRawQuery(s.tx, query, draft.Id, taskId)
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

// getTasks will get the tasks for the given projectId and also checks the ownership of the given user.
func (s *storePg) getTasks(projectId string, userId string, taskService *task.TaskService) ([]*task.Task, error) {
	p, err := s.getProject(projectId)
	if err != nil {
		return nil, err
	}

	// TODO IMPORTANT: I hope all of your red lights are flashing because this is currently really bad: A store using a service? Nope nope nope. There's already a TODO in the function calling this function.
	return taskService.GetTasks(p.TaskIDs, userId)
}
func (s *storePg) updateName(projectId string, newName string) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET name=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(s.tx, query, newName, projectId)
}

func (s *storePg) updateDescription(projectId string, newDescription string) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET description=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(s.tx, query, newDescription, projectId)
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func (s *storePg) execRawQuery(tx *sql.Tx, query string, params ...interface{}) error {
	util.LogQuery(query, params...)
	rows, err := tx.Query(query, params...)
	if err != nil {
		return errors.Wrap(err, "could not run query")
	}

	return rows.Close()
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func (s *storePg) execQuery(tx *sql.Tx, query string, params ...interface{}) (*Project, error) {
	util.LogQuery(query, params...)
	rows, err := tx.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	ok := rows.Next()
	if !ok {
		return nil, errors.New("there is no next row or an error happened")
	}

	p, err := s.rowToProject(rows)

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

	rows.Close()

	err = s.addTaskIdsToProject(&result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *storePg) addTaskIdsToProject(project *Project) error {
	query := fmt.Sprintf("SELECT ARRAY_AGG(task_id) FROM %s WHERE project_id = $1", s.relationTable)

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

	return nil
}