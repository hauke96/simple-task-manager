package project

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/hauke96/sigolo"
	"strconv"
	"strings"

	"github.com/hauke96/simple-task-manager/server/task"
)

type projectRow struct {
	id      int
	name    string
	taskIds string
	users   string
	owner   string
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
	query := fmt.Sprintf("SELECT * FROM %s WHERE users LIKE '%%%s%%'", s.table, user)
	sigolo.Debug("%s", query)

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}

	projects := make([]*Project, 0)
	for rows.Next() {
		project, err := rowToProject(rows)
		if err != nil {
			return nil, err
		}

		projects = append(projects, project)
	}

	return projects, nil
}

func (s *storePg) getProject(id string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id='%s'", s.table, id)
	return execQuery(s.db, query)
}

func (s *storePg) addProject(draft *Project, user string) (*Project, error) {
	taskIds := strings.Join(draft.TaskIDs, ",")

	query := fmt.Sprintf("INSERT INTO %s(name, task_ids, users, owner) VALUES('%s', '%s', '%s', '%s') RETURNING *", s.table, draft.Name, taskIds, user, user)
	return execQuery(s.db, query)
}

func (s *storePg) addUser(userToAdd string, id string, owner string) (*Project, error) {
	originalProject, err := GetProject(id)
	if err != nil {
		return nil, err
	}

	users := strings.Join(originalProject.Users, ",")
	query := fmt.Sprintf("UPDATE %s SET users='%s,%s' WHERE id=%s RETURNING *", s.table, users, userToAdd, id)
	return execQuery(s.db, query)
}

func (s *storePg) removeUser(id string, userToRemove string) (*Project, error) {
	originalProject, err := GetProject(id)
	if err != nil {
		return nil, err
	}

	remainingUsers := make([]string, 0)
	for _, u := range originalProject.Users {
		if u != userToRemove {
			remainingUsers = append(remainingUsers, u)
		}
	}

	users := strings.Join(remainingUsers, ",")
	query := fmt.Sprintf("UPDATE %s SET users='%s' WHERE id=%s RETURNING *", s.table, users, id)
	return execQuery(s.db, query)
}

func (s *storePg) delete(id string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=%s", s.table, id)

	_, err := s.db.Exec(query)
	return err
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func execQuery(db *sql.DB, query string) (*Project, error) {
	sigolo.Debug(query)
	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("could not run query: %w", err)
	}
	defer rows.Close()

	ok := rows.Next()
	if !ok {
		return nil, errors.New("there is no next row or an error happened")
	}

	return rowToProject(rows)
}

// rowToProject turns the current row into a Project object. This does not close the row.
func rowToProject(rows *sql.Rows) (*Project, error) {
	var p projectRow
	err := rows.Scan(&p.id, &p.name, &p.taskIds, &p.users, &p.owner)
	if err != nil {
		return nil, fmt.Errorf("could not scan rows: %w", err)
	}

	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.TaskIDs = strings.Split(p.taskIds, ",")
	result.Users = strings.Split(p.users, ",")
	result.Owner = p.owner

	return &result, nil
}

func (s *storePg) getTasks(id string) ([]*task.Task, error) {
	p, err := s.getProject(id)
	if err != nil {
		return nil, err
	}

	return task.GetTasks(p.TaskIDs)
}
