package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/lib/pq"
	"github.com/pkg/errors"
	"strconv"
	"time"
)

// Helper struct to read raw data from database. The "Project" struct has higher-level structure (e.g. arrays), which we
// don't have in the database columns.
type projectRow struct {
	id           int
	name         string
	users        []string
	owner        string
	description  string
	creationDate *time.Time
}

type storePg struct {
	*util.Logger
	tx        *sql.Tx
	table     string
	taskStore *task.StorePg
}

func getStore(tx *sql.Tx, taskStore *task.StorePg, logger *util.Logger) *storePg {
	return &storePg{
		Logger:    logger,
		tx:        tx,
		table:     "projects",
		taskStore: taskStore,
	}
}

func (s *storePg) getAllProjectsOfUser(userId string) ([]*Project, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1 = ANY(users)", s.table)

	s.LogQuery(query, userId)

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
		err = s.addTasksToProject(project)
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
	query := fmt.Sprintf("INSERT INTO %s (name, description, users, owner, creation_date) VALUES($1, $2, $3, $4, $5) RETURNING *", s.table)
	params := []interface{}{draft.Name, draft.Description, pq.Array(draft.Users), draft.Owner, creationDate}

	s.LogQuery(query, params...)
	project, err := s.execQueryWithoutTasks(query, params...)
	if err != nil {
		return nil, err
	}

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

func (s *storePg) updateName(projectId string, newName string) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET name=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(query, newName, projectId)
}

func (s *storePg) updateDescription(projectId string, newDescription string) (*Project, error) {
	query := fmt.Sprintf("UPDATE %s SET description=$1 WHERE id=$2 RETURNING *", s.table)
	return s.execQuery(query, newDescription, projectId)
}

func (s *storePg) execQueryWithoutTasks(query string, params ...interface{}) (*Project, error) {
	rows, err := s.tx.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errors.New("there is no next row or an error happened")
	}

	p, err := s.rowToProject(rows)
	if p == nil && err == nil {
		return nil, errors.New("Project does not exist")
	}

	return p, err
}

// execQuery executed the given query, turns the result into a Project object and closes the query.
func (s *storePg) execQuery(query string, params ...interface{}) (*Project, error) {
	s.LogQuery(query, params...)

	p, err := s.execQueryWithoutTasks(query, params...)
	if err != nil {
		return nil, err
	}

	err = s.addTasksToProject(p)
	if err != nil {
		return nil, err
	}

	return p, err
}

// rowToProject turns the current row into a Project object. This does not close the row.
func (s *storePg) rowToProject(rows *sql.Rows) (*Project, error) {
	var p projectRow
	err := rows.Scan(&p.id, &p.name, &p.owner, &p.description, pq.Array(&p.users), &p.creationDate)
	if err != nil {
		return nil, errors.Wrap(err, "could not scan rows")
	}

	result := Project{}

	result.Id = strconv.Itoa(p.id)
	result.Name = p.name
	result.Users = p.users
	result.Owner = p.owner
	result.Description = p.description

	if p.creationDate != nil {
		t := p.creationDate.UTC()
		result.CreationDate = &t
	}

	return &result, nil
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
