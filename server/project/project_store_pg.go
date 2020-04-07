package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"strconv"
	"strings"
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
	sigolo.Debug(query)
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}

	rows.Next()
	return rowToProject(rows)
}

func (s *storePg) addProject(draft *Project, user string) (*Project, error) {
	taskIds := strings.Join(draft.TaskIDs, ",")

	query := fmt.Sprintf("INSERT INTO %s(name, task_ids, users, owner) VALUES('%s', '%s', '%s', '%s') RETURNING id", s.table, draft.Name, taskIds, user, user)
	sigolo.Debug(query)
	row := s.db.QueryRow(query)

	var projectId int
	err := row.Scan(&projectId)
	if err != nil {
		return nil, err
	}

	return GetProject(strconv.Itoa(projectId))
}

func (s *storePg) addUser(userToAdd string, id string, owner string) (*Project, error) {
	originalProject, err := GetProject(id)
	if err != nil {
		return nil, err
	}

	// TODO SQL error when setting user
	users := originalProject.Users
	query := fmt.Sprintf("UPDATE %s SET users='%s,%s' WHERE id=%s", s.table, users, userToAdd, id)
	sigolo.Debug(query)
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}

	rows.Next()
	return rowToProject(rows) // TODO Does this work? Try get updated object as return from query using "RETURNING ..."?
}

func rowToProject(rows *sql.Rows) (*Project, error) {
	var p projectRow
	err := rows.Scan(&p.id, &p.name, &p.taskIds, &p.users, &p.owner)
	if err != nil {
		return nil, err
	}

	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.TaskIDs = strings.Split(p.taskIds, ",")
	result.Users = strings.Split(p.users, ",")
	result.Owner = p.owner

	return &result, nil
}
