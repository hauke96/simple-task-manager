package api

import (
	"database/sql"
	"github.com/pkg/errors"
	"stm/database"
	"stm/export"
	"stm/oauth2"
	"stm/permission"
	"stm/project"
	"stm/task"
	"stm/util"
	"stm/websocket"
)

type Context struct {
	*util.Logger
	Token           *oauth2.Token
	Transaction     *sql.Tx
	ProjectService  *project.ProjectService
	TaskService     *task.TaskService
	ExportService   *export.ExportService
	WebsocketSender *websocket.WebsocketSender
}

// createContext starts a new Transaction and creates new service instances which use this new Transaction so that all
// services (also those calling each other) are using the same Transaction.
func createContext(token *oauth2.Token, logger *util.Logger) (*Context, error) {
	ctx := &Context{}
	ctx.Token = token
	ctx.Logger = logger

	tx, err := database.GetTransaction(logger)
	if err != nil {
		return nil, errors.Wrap(err, "error getting Transaction")
	}
	ctx.Transaction = tx

	permissionStore := permission.Init(tx, ctx.Logger)
	ctx.TaskService = task.Init(tx, ctx.Logger, permissionStore)
	ctx.ProjectService = project.Init(tx, ctx.Logger, ctx.TaskService, permissionStore)
	ctx.ExportService = export.Init(logger, ctx.ProjectService)
	ctx.WebsocketSender = websocket.Init(ctx.Logger)

	return ctx, nil
}
