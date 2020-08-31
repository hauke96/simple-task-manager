package api

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/pkg/errors"
)

var (
	nextTraceId = 0
)

type Logger struct {
	logTraceId     int
}

func (l *Logger) log(format string, args ...interface{}) {
	sigolo.Infob(1, "#%x | %s", l.logTraceId, fmt.Sprintf(format, args...))
}

func (l *Logger) err(message string) {
	sigolo.Errorb(1, "#%x | %s", l.logTraceId, message)
}

func (l *Logger) stack(err error) {
	sigolo.Stackb(1, err)
}


type Context struct {
	Logger
	token          *auth.Token
	transaction    *sql.Tx
	projectService *project.ProjectService
	taskService    *task.TaskService
}

// createContext starts a new transaction and creates new service instances which use this new transaction so that all
// services (also those calling each other) are using the same transaction.
func createContext(token *auth.Token) (*Context, error) {
	context := &Context{}
	context.token = token

	tx, err := database.GetTransaction()
	if err != nil {
		return nil, errors.Wrap(err, "error getting transaction")
	}
	context.transaction = tx

	permissionService := permission.Init(tx)
	context.taskService = task.Init(tx, permissionService)
	context.projectService = project.Init(tx, context.taskService, permissionService)

	context.logTraceId = nextTraceId
	nextTraceId++

	return context, nil
}