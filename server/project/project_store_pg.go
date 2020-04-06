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

func (p *storePg) init(db *sql.DB) {
	p.db = db
	p.table = "projects"
}

func (p *storePg) getProjects(user string) []*Project {
	query := fmt.Sprintf("SELECT * FROM %s WHERE users='%s'", p.table, user)
	sigolo.Debug(query)
	rows, err := p.db.Query(query)
	if err != nil {
		return nil
	}

	projects := make([]*Project, 0)
	for rows.Next() {
		var proj projectRow
		err = rows.Scan(&proj.id, &proj.name, &proj.taskIds, &proj.users, &proj.owner)
		if err != nil {
			return nil
		}

		project := rowToProject(proj)
		projects = append(projects, &project)
	}

	return projects
}

func (p *storePg) getProject(id string) (*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id='%s'", p.table, id)
	sigolo.Debug(query)
	rows := p.db.QueryRow(query)

	var proj projectRow
	err := rows.Scan(&proj.id, &proj.name, &proj.taskIds, &proj.users, &proj.owner)
	if err != nil {
		return nil, err
	}

	result := rowToProject(proj)

	return &result, nil
}

func (p *storePg) addProject(draft *Project, user string) *Project { //} (*Project, error) {
	taskIds := strings.Join(draft.TaskIDs, ",")
	var projectId int

	query := fmt.Sprintf("INSERT INTO %s(name, taskIds, users, owner) VALUES('%s', '%s', '%s', '%s') RETURNING id", p.table, draft.Name, taskIds, user, user)
	sigolo.Debug(query)
	row := p.db.QueryRow(query)

	err := row.Scan(&projectId)
	if err != nil {
		return nil
	}

	project, _ := GetProject(strconv.Itoa(projectId))

	return project
}

func (p *storePg) addUser(userToAdd string, id string, owner string) (*Project, error) {
	panic("implement me")
}

func rowToProject(p projectRow) Project {
	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.TaskIDs = strings.Split(p.taskIds, ",")
	result.Users = strings.Split(p.users, ",")
	result.Owner = p.owner

	return result
}
