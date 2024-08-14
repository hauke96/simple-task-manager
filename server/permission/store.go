package permission

import (
	"database/sql"
	"fmt"
	"github.com/lib/pq"
	"github.com/pkg/errors"
	"stm/util"
)

type Store struct {
	*util.Logger
	tx *sql.Tx
}

var (
	taskTable    = "tasks"
	projectTable = "projects"
)

// Init the permission store for the project and task table.
func Init(tx *sql.Tx, logger *util.Logger) *Store {
	return &Store{
		Logger: logger,
		tx:     tx,
	}
}

// VerifyOwnership check if the given user is the owner of the given project.
func (s *Store) VerifyOwnership(projectId string, user string) error {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1 AND owner=$2", projectTable)

	s.LogQuery(query, projectId, user)
	rows, err := s.tx.Query(query, projectId, user)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("error verifying ownership of user %s in project %s", user, projectId))
	}
	defer rows.Close()

	// If there's a next row, then the user "user" is in the owner of the project "projectId"
	if !rows.Next() {
		return errors.New(fmt.Sprintf("user %s is not the owner of project %s", user, projectId))
	}

	return nil
}

// VerifyMembershipProject checks if "user" is a member of the project "id".
func (s *Store) VerifyMembershipProject(projectId string, user string) error {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id=$1 AND $2=ANY(users)", projectTable)

	s.LogQuery(query, projectId, user)
	rows, err := s.tx.Query(query, projectId, user)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("error verifying membership of user %s in project %s", user, projectId))
	}
	defer rows.Close()

	// If there's a next row, then the user "user" is in the list of members of project "projectId"
	if !rows.Next() {
		return errors.New(fmt.Sprintf("user %s is not a member of project %s", user, projectId))
	}

	return nil
}

// VerifyMembershipTask checks if "user" is a member of the project, where the given task with "id" is in.
func (s *Store) VerifyMembershipTask(taskId string, user string) error {
	query := fmt.Sprintf("SELECT * FROM %s p, %s t WHERE t.project_id = p.id AND t.id = $1 AND $2=ANY(p.users);", projectTable, taskTable)

	s.LogQuery(query, taskId, user)
	rows, err := s.tx.Query(query, taskId, user)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("error verifying membership of user %s for task %s", user, taskId))
	}
	defer rows.Close()

	// If there's a next row, then the given task in in the list of a project where the given user is a member of.
	if !rows.Next() {
		return errors.New(fmt.Sprintf("user %s is not a member of the project where the task %s is in", user, taskId))
	}

	return nil
}

// VerifyMembershipTask checks if "user" is a member of the projects, where the given tasks are in.
func (s *Store) VerifyMembershipTasks(taskIds []string, user string) error {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s p, %s t WHERE t.project_id = p.id AND t.id = ANY($1) AND $2=ANY(p.users);", projectTable, taskTable)

	s.LogQuery(query, pq.Array(taskIds), user)
	rows, err := s.tx.Query(query, pq.Array(taskIds), user)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("error verifying membership of user %s for tasks %v", user, taskIds))
	}
	defer rows.Close()

	// If there's a next row, then the given task in in the list of a project where the given user is a member of.
	if !rows.Next() {
		return errors.New(fmt.Sprintf("user %s is not a member of all projects where the tasks %v are in", user, taskIds))
	}

	var taskMemberships int
	err = rows.Scan(&taskMemberships)
	if err != nil {
		return errors.Wrap(err, "unable to read task membership result")
	}

	if taskMemberships != len(taskIds) {
		return errors.New(fmt.Sprintf("user %s is not a member of all %d tasks (only of %d)", user, len(taskIds), taskMemberships))
	}

	return nil
}

// VerifyCanUnassign returns an error when the given user is not allowed to unassign the current user of the given task.
func (s *Store) VerifyCanUnassign(taskId string, user string) error {
	// Get task only if the given user is assigned OR the given user is the owner of the project.
	query := fmt.Sprintf("SELECT * FROM %s t WHERE t.id=$1 AND (t.assigned_user=$2 OR (SELECT p.owner FROM projects p WHERE p.id = t.project_id)=$2);", taskTable)

	s.LogQuery(query, taskId, user)
	rows, err := s.tx.Query(query, taskId, user)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("error verifying assignment of user %s to task %s", user, taskId))
	}
	defer rows.Close()

	// If there's a next row, then the given user is assigned to the given task
	if !rows.Next() {
		return errors.New(fmt.Sprintf("user %s is not assigned to task %s", user, taskId))
	}

	return nil
}

// AssignmentInProjectNeeded determines whether a user needs to be assigned to tasks in this project.
func (s *Store) AssignmentInProjectNeeded(projectId string) (bool, error) {
	query := fmt.Sprintf("SELECT ARRAY_LENGTH(users, 1) FROM %s WHERE id=$1;", projectTable)

	s.LogQuery(query, projectId)
	rows, err := s.tx.Query(query, projectId)
	if err != nil {
		return true, errors.Wrap(err, fmt.Sprintf("error getting assignment requirement for project %s", projectId))
	}
	defer rows.Close()

	if !rows.Next() {
		return true, errors.New(fmt.Sprintf("no row to get assignment requirement for project %s", projectId))
	}

	var userCount int
	err = rows.Scan(&userCount)
	if err != nil {
		return true, errors.Wrap(err, fmt.Sprintf("error reading row to get assignment requirement for project %s", projectId))
	}

	// Tasks in a project with only one user (the owner) don't need an assignment
	return userCount != 1, nil
}

// AssignmentInTaskNeeded determines whether a user needs to be assigned to this task.
func (s *Store) AssignmentInTaskNeeded(taskId string) (bool, error) {
	query := fmt.Sprintf("SELECT ARRAY_LENGTH(p.users, 1) FROM %s p, %s t WHERE $1 = t.id AND t.project_id = p.id;", projectTable, taskTable)

	s.LogQuery(query, taskId)
	rows, err := s.tx.Query(query, taskId)
	if err != nil {
		return true, errors.Wrap(err, fmt.Sprintf("error getting assignment requirement for task %s", taskId))
	}
	defer rows.Close()

	if !rows.Next() {
		return true, errors.New(fmt.Sprintf("no row to get assignment requirement for task %s", taskId))
	}

	var userCount int
	err = rows.Scan(&userCount)
	if err != nil {
		return true, errors.Wrap(err, fmt.Sprintf("error reading row to get assignment requirement for task %s", taskId))
	}

	// Tasks in a project with only one user (the owner) don't need an assignment
	return userCount != 1, nil
}
