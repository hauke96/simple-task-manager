package context

import (
	"database/sql"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/pkg/errors"
)

type Context struct {
	Logger
	Token          *auth.Token
	Transaction    *sql.Tx
	ProjectService *project.ProjectService
	TaskService    *task.TaskService
}

// createContext starts a new Transaction and creates new service instances which use this new Transaction so that all
// services (also those calling each other) are using the same Transaction.
func CreateContext(token *auth.Token) (*Context, error) {
	context := &Context{}
	context.Token = token

	tx, err := database.GetTransaction()
	if err != nil {
		return nil, errors.Wrap(err, "error getting Transaction")
	}
	context.Transaction = tx

	context.LogTraceId = getNextTraceId()

	permissionService := permission.Init(tx, context.LogTraceId)
	context.TaskService = task.Init(tx, context.LogTraceId, permissionService)
	context.ProjectService = project.Init(tx, context.LogTraceId, context.TaskService, permissionService)

	return context, nil
}