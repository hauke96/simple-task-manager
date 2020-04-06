package project

import (
	"database/sql"
	"fmt"
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

type ProjectStorePg struct {
	db    *sql.DB
	table string
}

func (p *ProjectStorePg) init(db *sql.DB) {
	p.db = db
	p.table = "projects"
}

func (p *ProjectStorePg) getProjects(user string) []*Project {
	rows, err := p.db.Query(fmt.Sprintf("SELECT * FROM %s WHERE users=%s", p.table, user))
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

func (p *ProjectStorePg) getProject(id string) (*Project, error) {
	rows := p.db.QueryRow(fmt.Sprintf("SELECT * FROM %s WHERE id=%s", p.table, id))

	var proj projectRow
	err := rows.Scan(&proj.id, &proj.name, &proj.taskIds, &proj.users, &proj.owner)
	if err != nil {
		return nil, err
	}

	result := rowToProject(proj)

	return &result, nil
}

func (p *ProjectStorePg) addProject(draft *Project, user string) *Project { //} (*Project, error) {
	taskIds := strings.Join(draft.TaskIDs, ",")
	var projectId int

	row := p.db.QueryRow(fmt.Sprintf("INSERT INTO %s(%s, %s, %s, %s, %s) RETURNING id", p.table, draft.Id, draft.Name, taskIds, user, user))

	err := row.Scan(&projectId)
	if err != nil {
		return nil
	}

	project, _ := GetProject(strconv.Itoa(projectId))

	return project
}

func (p *ProjectStorePg) addUser(userToAdd string, id string, owner string) (*Project, error) {
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
