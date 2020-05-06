package permission

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/pkg/errors"
)

var (
	db           *sql.DB
	taskTable    string
	projectTable string
)

func Init() {
	var err error
	db, err = sql.Open("postgres", "user=postgres password=geheim dbname=stm sslmode=disable")
	sigolo.FatalCheck(err)
}

// VerifyOwnership check if the given user is the owner of the given project.
func VerifyOwnership(projectId string, user string) (bool, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE projectId=$1 AND owner=$2", projectTable)

	util.LogQuery(query, projectId, user)
	rows, err := db.Query(query, projectId, user)
	if err != nil {
		return false, errors.Wrap(err, fmt.Sprintf("error verifying ownership of user %s in project %s", user, projectId))
	}
	defer rows.Close()

	// If there's a next row, then the user "user" is in the owner of the project "projectId"
	return rows.Next(), nil
}

// VerifyMembershipProject checks if "user" is a member of the project "id".
func VerifyMembershipProject(projectId string, user string) (bool, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE projectId=$1 AND $2=ANY(users)", projectTable)

	util.LogQuery(query, projectId, user)
	rows, err := db.Query(query, projectId, user)
	if err != nil {
		return false, errors.Wrap(err, fmt.Sprintf("error verifying membership of user %s in project %s", user, projectId))
	}
	defer rows.Close()

	// If there's a next row, then the user "user" is in the list of members of project "projectId"
	return rows.Next(), nil
}

// VerifyMembershipTask checks if "user" is a member of the project, where the given task with "id" is in.
func VerifyMembershipTask(taskId string, user string) (bool, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE $1=ANY(task_ids) AND $2=ANY(users);", projectTable)

	util.LogQuery(query, taskId, user)
	rows, err := db.Query(query, taskId, user)
	if err != nil {
		return false, errors.Wrap(err, fmt.Sprintf("error verifying membership of user %s in task %s", user, taskId))
	}
	defer rows.Close()

	// If there's a next row, then the given task in in the list of a project where the given user is a member of.
	return rows.Next(), nil
}