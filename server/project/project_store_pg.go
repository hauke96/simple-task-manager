package project

import (
	"database/sql"
	"fmt"
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
	db    *sql.DB
	table string
}

func (s *storePg) init(db *sql.DB) {
	s.db = db
	s.table = "projects"
}

func (s *storePg) getProjects(user string) ([]*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1=ANY(users)", s.table)

	util.LogQuery(query, user)

	rows, err := s.db.Query(query, user)
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
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1=ANY(task_ids)", s.table)
	return execQuery(s.db, query, taskId)
}

func (s *storePg) addProject(draft *Project, user string) (*Project, error) {
	query := fmt.Sprintf("INSERT INTO %s (name, task_ids, description, users, owner) VALUES($1, $2, $3, $4, $5) RETURNING *", s.table)

	return execQuery(s.db, query, draft.Name, pq.Array(draft.TaskIDs), draft.Description, pq.Array(draft.Users), draft.Owner)
}

func (s *storePg) addUser(userToAdd string, id string, owner string) (*Project, error) {
	originalProject, err := s.getProject(id)
	if err != nil {
		return nil, errors.Wrapf(err, "error getting project with ID '%s'", id)
	}

	newUsers := append(originalProject.Users, userToAdd)

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return execQuery(s.db, query, pq.Array(newUsers), id)
}

func (s *storePg) removeUser(id string, userToRemove string) (*Project, error) {
	originalProject, err := s.getProject(id)
	if err != nil {
		return nil, errors.Wrapf(err, "error getting project with ID '%s'", id)
	}

	remainingUsers := make([]string, 0)
	for _, u := range originalProject.Users {
		if u != userToRemove {
			remainingUsers = append(remainingUsers, u)
		}
	}

	query := fmt.Sprintf("UPDATE %s SET users=$1 WHERE id=$2 RETURNING *", s.table)
	return execQuery(s.db, query, pq.Array(remainingUsers), id)
}

func (s *storePg) delete(id string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=$1", s.table)

	_, err := s.db.Exec(query, id)
	return err
}

func (s *storePg) verifyMembership(id string, user string) (bool, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1 AND $2=ANY(users)", s.table)

	util.LogQuery(query, id, user)
	rows, err := s.db.Query(query, id, user)
	if err != nil {
		return false, errors.Wrap(err, fmt.Sprintf("error membership of user %s in project %s", user, id))
	}
	defer rows.Close()

	// If there's a next row, then the user "user" is in the list of users in project "id"
	return rows.Next(), nil
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func execQuery(db *sql.DB, query string, params ...interface{}) (*Project, error) {
	util.LogQuery(query, params...)
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
	err := rows.Scan(&p.id, &p.name, &p.owner, &p.description, pq.Array(&p.taskIds), pq.Array(&p.users))
	if err != nil {
		return nil, errors.Wrap(err, "could not scan rows")
	}

	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.Users = p.users
	result.Owner = p.owner
	result.Description = p.description
	result.NeedsAssignment = len(result.Users) > 1

	result.TaskIDs = p.taskIds
	//result.TaskIDs = make([]string, len(p.taskIds))
	//for i, v := range p.taskIds {
	//	result.TaskIDs[i] = strconv.Itoa(v)
	//}

	return &result, nil
}

func (s *storePg) getTasks(id string) ([]*task.Task, error) {
	p, err := s.getProject(id)
	if err != nil {
		return nil, err
	}

	return task.GetTasks(p.TaskIDs)
}
