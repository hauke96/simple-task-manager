package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/pkg/errors"
	"strconv"
	"strings"

	"github.com/hauke96/simple-task-manager/server/task"
)

// Helper struct to read raw data from database. The "Project" struct has higher-level structure (e.g. arrays), which we
// don't have in the database columns.
type projectRow struct {
	id          int
	name        string
	taskIds     string
	users       string
	owner       string
	description string
}

type storePg struct {
	db    *sql.DB
	table string
}

func (s *storePg) init(db *sql.DB) {
	s.db = db
	s.table = "projects"
}

func (s *storePg) getProjects(user string) ([]*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE users LIKE $1", s.table)

	// The logging needs "%%" as escape sequence for the simple "%"
	arg := interface{}("%%" + user + "%%")
	util.LogQuery(query, []interface{}{arg})

	rows, err := s.db.Query(query, "%"+user+"%")
	if err != nil {
		return nil, errors.Wrap(err, "error executing query")
	}

	projects := make([]*Project, 0)
	for rows.Next() {
		project, err := rowToProject(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row into project")
		}

		projects = append(projects, project)
	}

	return projects, nil
}

func (s *storePg) getProject(id string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1", s.table)
	return execQuery(s.db, query, id)
}

func (s *storePg) getProjectByTask(taskId string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE task_ids LIKE $1", s.table)
	return execQuery(s.db, query, "%"+taskId+"%")
}

func (s *storePg) addProject(draft *Project, user string) (*Project, error) {
	taskIds := strings.Join(draft.TaskIDs, ",")
	users := strings.Join(draft.Users, ",")

	query := fmt.Sprintf("INSERT INTO %s (name, task_ids, description, users, owner) VALUES($1, $2, $3, $4, $5) RETURNING *", s.table)

	return execQuery(s.db, query, draft.Name, taskIds, draft.Description, users, draft.Owner)
}

func (s *storePg) addUser(userToAdd string, id string, owner string) (*Project, error) {
	originalProject, err := GetProject(id)
	if err != nil {
		return nil, errors.Wrapf(err, "error getting project with ID '%s'", id)
	}

	originalProject.Users = append(originalProject.Users, userToAdd)
	users := strings.Join(originalProject.Users, ",")

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return execQuery(s.db, query, users, id)
}

func (s *storePg) removeUser(id string, userToRemove string) (*Project, error) {
	originalProject, err := GetProject(id)
	if err != nil {
		return nil, errors.Wrapf(err, "error getting project with ID '%s'", id)
	}

	remainingUsers := make([]string, 0)
	for _, u := range originalProject.Users {
		if u != userToRemove {
			remainingUsers = append(remainingUsers, u)
		}
	}

	users := strings.Join(remainingUsers, ",")
	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return execQuery(s.db, query, users, id)
}

func (s *storePg) delete(id string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", s.table)

	_, err := s.db.Exec(query, id)
	return err
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func execQuery(db *sql.DB, query string, params ...interface{}) (*Project, error) {
	util.LogQuery(query, params)
	rows, err := db.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	ok := rows.Next()
	if !ok {
		return nil, errors.New("there is no next row or an error happened")
	}

	p, err := rowToProject(rows)

	if p == nil && err == nil {
		return nil, errors.New(fmt.Sprintf("Project does not exist"))
	}

	return p, err
}

// rowToProject turns the current row into a Project object. This does not close the row.
func rowToProject(rows *sql.Rows) (*Project, error) {
	var p projectRow
	err := rows.Scan(&p.id, &p.name, &p.taskIds, &p.users, &p.owner, &p.description)
	if err != nil {
		return nil, errors.Wrap(err, "could not scan rows")
	}

	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.TaskIDs = strings.Split(p.taskIds, ",")
	result.Users = strings.Split(p.users, ",")
	result.Owner = p.owner
	result.Description = p.description
	result.NeedsAssignment = len(result.Users) > 1

	return &result, nil
}

func (s *storePg) getTasks(id string) ([]*task.Task, error) {
	p, err := s.getProject(id)
	if err != nil {
		return nil, err
	}

	return task.GetTasks(p.TaskIDs)
}
