package task

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/lib/pq"
	"github.com/pkg/errors"
	"strconv"
	"strings"
)

type taskRow struct {
	id               int
	processPoints    int
	maxProcessPoints int
	geometry         string
	assignedUser     string
}

type storePg struct {
	db    *sql.DB
	table string
}

func (s *storePg) init(db *sql.DB) {
	s.db = db
	s.table = "tasks"
}

func (s *storePg) getTasks(taskIds []string) ([]*Task, error) {
	// Turn the given taskIDs into a slice of "interface{}", because the "Query" function below need this type.
	// Also create the query parameter placeholder string ("$1", "$2", etc.).
	taskIdNumbers := make([]interface{}, len(taskIds))
	queryPlaceholderStrings := make([]string, len(taskIds))
	for i, _ := range taskIds {
		n, err := strconv.Atoi(taskIds[i])

		if err != nil {
			return nil, err
		}

		taskIdNumbers[i] = n
		queryPlaceholderStrings[i] = fmt.Sprintf("$%d", i+1)
	}

	// Generate "IN" clause with "$1,$2,,..." string for all IDs
	// TODO use postgres arrays
	query := fmt.Sprintf("SELECT * FROM %s WHERE id IN (%s);", s.table, strings.Join(queryPlaceholderStrings, ","))
	util.LogQuery(query, taskIdNumbers...)

	rows, err := s.db.Query(query, taskIdNumbers...)
	if err != nil {
		return nil, errors.Wrap(err, "error executing query")
	}
	defer rows.Close()

	// Read all tasks from the returned rows of the query
	tasks := make([]*Task, 0)
	for rows.Next() {
		var t taskRow
		err = rows.Scan(&t.id, &t.processPoints, &t.maxProcessPoints, &t.geometry, &t.assignedUser)
		if err != nil {
			return nil, errors.Wrap(err, "unable to scan task row")
		}

		task, err := rowToTask(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row to task")
		}

		tasks = append(tasks, task)
	}

	if len(tasks) == 0 {
		return nil, errors.New(fmt.Sprintf("Tasks do not exist"))
	}

	return tasks, nil
}

func (s *storePg) getTask(id string) (*Task, error) {
	tasks, err := s.getTasks([]string{id})
	if err != nil {
		return nil, err
	}

	return tasks[0], nil
}

func (s *storePg) addTasks(newTasks []*Task) ([]*Task, error) {
	taskIds := make([]string, 0)

	// TODO Do not add one by one but instead build one large query (otherwise it's really slow)
	for _, t := range newTasks {
		id, err := s.addTask(t)
		if err != nil {
			return nil, errors.Wrapf(err, "error adding task '%s'", t.Id)
		}

		taskIds = append(taskIds, id)
	}

	return s.getTasks(taskIds)
}

func (s *storePg) addTask(task *Task) (string, error) {
	geometryBytes, err := json.Marshal(task.Geometry)
	if err != nil {
		sigolo.Error("Cannot parse geometry:\n%v", task.Geometry)
		return "", errors.Wrapf(err, "unable to marshal geometry of task '%s'", task.Id)
	}

	query := fmt.Sprintf("INSERT INTO %s(process_points, max_process_points, geometry, assigned_user) VALUES($1, $2, $3, $4) RETURNING *;", s.table)
	t, err := execQuery(s.db, query, task.ProcessPoints, task.MaxProcessPoints, string(geometryBytes), task.AssignedUser)

	if err == nil && t != nil {
		return t.Id, nil
	}

	return "", err
}

func (s *storePg) assignUser(id, user string) (*Task, error) {
	query := fmt.Sprintf("UPDATE %s SET assigned_user=$1 WHERE id=$2 RETURNING *;", s.table)
	return execQuery(s.db, query, user, id)
}

func (s *storePg) unassignUser(id string) (*Task, error) {
	query := fmt.Sprintf("UPDATE %s SET assigned_user='' WHERE id=$1 RETURNING *;", s.table)
	return execQuery(s.db, query, id)
}

func (s *storePg) setProcessPoints(id string, newPoints int) (*Task, error) {
	query := fmt.Sprintf("UPDATE %s SET process_points=$1 WHERE id=$2 RETURNING *;", s.table)
	return execQuery(s.db, query, newPoints, id)
}

func (s *storePg) delete(taskIds []string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=ALL($1)", s.table)

	util.LogQuery(query, taskIds)
	_, err := s.db.Exec(query, pq.Array(taskIds))
	if err != nil {
		return err
	}

	return nil
}

// execQuery executed the given query, turns the result into a Task object and closes the query.
func execQuery(db *sql.DB, query string, params ...interface{}) (*Task, error) {
	util.LogQuery(query, params...)
	rows, err := db.Query(query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	rows.Next()
	t, err := rowToTask(rows)

	if t == nil && err == nil {
		return nil, errors.New(fmt.Sprintf("Task does not exist"))
	}

	return t, err
}

// rowToTask turns the current row into a Task object. This does not close the row.
func rowToTask(rows *sql.Rows) (*Task, error) {
	var task taskRow
	err := rows.Scan(&task.id, &task.processPoints, &task.maxProcessPoints, &task.geometry, &task.assignedUser)
	if err != nil {
		return nil, err
	}

	result := Task{}

	result.Id = strconv.Itoa(task.id)
	result.ProcessPoints = task.processPoints
	result.MaxProcessPoints = task.maxProcessPoints
	result.AssignedUser = task.assignedUser

	var g [][]float64
	err = json.Unmarshal([]byte(task.geometry), &g)
	if err != nil {
		return nil, err
	}
	result.Geometry = g

	return &result, err
}
