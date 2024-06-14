package task

import (
	"database/sql"
	"fmt"
	"github.com/lib/pq"
	geojson "github.com/paulmach/go.geojson"
	"github.com/pkg/errors"
	"stm/comment"
	"stm/util"
	"strconv"
)

type taskRow struct {
	id               int
	processPoints    int
	maxProcessPoints int
	geometry         string
	assignedUser     string
	commentListId    string
}

type Store struct {
	*util.Logger
	tx           *sql.Tx
	Table        string
	commentStore *comment.Store
}

var (
	returnValues = "id, process_points, max_process_points, geometry, assigned_user, comment_list_id"
)

func GetStore(tx *sql.Tx, logger *util.Logger, commentStore *comment.Store) *Store {
	return &Store{
		Logger:       logger,
		tx:           tx,
		Table:        "tasks",
		commentStore: commentStore,
	}
}

func (s *Store) GetAllTasksOfProject(projectId string) ([]*Task, error) {
	query := fmt.Sprintf("SELECT id,process_points,max_process_points,geometry,assigned_user,comment_list_id FROM %s WHERE project_id = $1;", s.Table)
	s.LogQuery(query, projectId)

	rows, err := s.tx.Query(query, projectId)
	if err != nil {
		return nil, errors.Wrapf(err, "error executing query to get tasks for project %s", projectId)
	}

	// Read all tasks from the returned rows of the query
	tasks := make([]*Task, 0)
	taskRows := make([]*taskRow, 0)
	for rows.Next() {
		task, taskRow, err := s.rowToTask(rows)
		if err != nil {
			return nil, errors.Wrap(err, "error converting row to task")
		}

		tasks = append(tasks, task)
		taskRows = append(taskRows, taskRow)
	}

	err = rows.Close()
	if err != nil {
		return nil, errors.Wrap(err, "error closing rows")
	}

	if len(tasks) == 0 {
		return nil, errors.New("Tasks do not exist")
	}

	for i, task := range tasks {
		comments, err := s.commentStore.GetComments(taskRows[i].commentListId)
		if err != nil {
			return nil, err
		}
		task.Comments = comments
	}

	return tasks, nil
}

func (s *Store) getTask(taskId string) (*Task, error) {
	query := fmt.Sprintf("SELECT id,process_points,max_process_points,geometry,assigned_user,comment_list_id FROM %s WHERE id = $1;", s.Table)
	s.LogQuery(query, taskId)

	task, err := s.execQuery(query, taskId)

	if err != nil {
		return nil, err
	}

	return task, nil
}

func (s *Store) addTasks(newTasks []DraftDto, projectId string) ([]*Task, error) {
	taskIds := make([]string, 0)

	commentListId, err := s.commentStore.NewCommentList()
	if err != nil {
		return nil, err
	}

	// TODO Do not add one by one but instead build one large query (otherwise it's really slow)
	for _, t := range newTasks {
		id, err := s.addTask(&t, projectId, commentListId)
		if err != nil {
			s.Err("error adding task: %s", err.Error())
			return nil, err
		}

		taskIds = append(taskIds, id)
	}

	return s.GetAllTasksOfProject(projectId)
}

func (s *Store) addTask(task *DraftDto, projectId string, commentListId string) (string, error) {
	query := fmt.Sprintf("INSERT INTO %s(process_points, max_process_points, geometry, assigned_user, project_id, comment_list_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING %s;", s.Table, returnValues)
	t, err := s.execQuery(query, task.ProcessPoints, task.MaxProcessPoints, task.Geometry, "", projectId, commentListId)

	if err != nil {
		return "", err
	}

	return t.Id, nil
}

func (s *Store) assignUser(taskId, userId string) (*Task, error) {
	query := fmt.Sprintf("UPDATE %s SET assigned_user=$1 WHERE id=$2 RETURNING %s;", s.Table, returnValues)
	return s.execQuery(query, userId, taskId)
}

func (s *Store) unassignUser(taskId string) (*Task, error) {
	query := fmt.Sprintf("UPDATE %s SET assigned_user='' WHERE id=$1 RETURNING %s;", s.Table, returnValues)
	return s.execQuery(query, taskId)
}

func (s *Store) setProcessPoints(taskId string, newPoints int) (*Task, error) {
	query := fmt.Sprintf("UPDATE %s SET process_points=$1 WHERE id=$2 RETURNING %s;", s.Table, returnValues)
	return s.execQuery(query, newPoints, taskId)
}

func (s *Store) delete(taskIds []string) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id=ANY($1)", s.Table)

	s.LogQuery(query, taskIds)
	_, err := s.tx.Exec(query, pq.Array(taskIds))
	if err != nil {
		return err
	}

	return nil
}

func (s *Store) getCommentListId(taskId string) (string, error) {
	query := fmt.Sprintf("SELECT comment_list_id FROM %s WHERE id = $1;", s.Table)
	s.LogQuery(query, taskId)

	rows, err := s.tx.Query(query, taskId)
	if err != nil {
		return "", errors.Wrapf(err, "error executing query to get comment list id for task %s", taskId)
	}
	defer rows.Close()

	if !rows.Next() {
		return "", errors.New("there is no next row or an error happened")
	}

	commentListId := ""
	err = rows.Scan(&commentListId)
	if err != nil {
		return "", errors.Wrap(err, "could not scan row for comment list id")
	}

	return commentListId, nil
}

// execQuery executed the given query, turns the result into a Task object and closes the query.
func (s *Store) execQuery(query string, params ...interface{}) (*Task, error) {
	s.LogQuery(query, params...)
	rows, err := s.tx.Query(query, params...)
	if err != nil {
		return nil, errors.Wrap(err, "could not run query")
	}

	rows.Next()
	task, taskRow, err := s.rowToTask(rows)

	err = rows.Close()
	if err != nil {
		return nil, errors.Wrap(err, "error closing rows")
	}

	if task == nil {
		return nil, errors.New(fmt.Sprintf("Task does not exist"))
	}

	comments, err := s.commentStore.GetComments(taskRow.commentListId)
	if err != nil {
		return nil, err
	}
	task.Comments = comments

	return task, err
}

// rowToTask turns the current row into a Task object. This does not close the row.
func (s *Store) rowToTask(rows *sql.Rows) (*Task, *taskRow, error) {
	var task taskRow
	err := rows.Scan(&task.id, &task.processPoints, &task.maxProcessPoints, &task.geometry, &task.assignedUser, &task.commentListId)
	if err != nil {
		return nil, nil, errors.Wrap(err, "could not scan rows")
	}

	result := Task{}

	result.Id = strconv.Itoa(task.id)
	result.ProcessPoints = task.processPoints
	result.MaxProcessPoints = task.maxProcessPoints
	result.AssignedUser = task.assignedUser
	result.Geometry = task.geometry

	feature, err := geojson.UnmarshalFeature([]byte(result.Geometry))
	if feature == nil || err != nil {
		return nil, nil, errors.Wrapf(err, "could not unmarshal task geometry '%s' from row", result.Geometry)
	}
	name, err := feature.PropertyString("name")
	if err == nil {
		result.Name = name
	}

	return &result, &task, nil
}
