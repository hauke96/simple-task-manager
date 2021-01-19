package main

import (
	"github.com/hauke96/kingpin"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/api"
	_ "github.com/lib/pq" // Make driver "postgres" usable
	"os"

	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/config"
	_ "github.com/hauke96/simple-task-manager/server/docs"
	"github.com/hauke96/simple-task-manager/server/util"
)

var (
	app       = kingpin.New("Simple Task Manager", "A tool dividing an area of the map into smaller tasks.")
	appConfig = app.Flag("config", "The config file. CLI argument override the settings from that file.").Short('c').Default("./config/default.json").String()
)

func configureCliArgs() {
	app.Author("Hauke Stieler")
	app.Version(util.VERSION)

	app.HelpFlag.Short('h')
	app.VersionFlag.Short('v')
}

func configureLogging() {
	if config.Conf.DebugLogging {
		sigolo.LogLevel = sigolo.LOG_DEBUG
	} else {
		sigolo.LogLevel = sigolo.LOG_INFO
	}
}

// @title SimpleTaskManager Server
// @version 1.3.0
// @description This is the SimpleTaskManager (STM) Server.

// @contact.name STM issue tracker
// @contact.url https://github.com/hauke96/simple-task-manager/issues

// @license.name GNU General Public License 3.0
// @license.url https://github.com/hauke96/simple-task-manager/blob/master/LICENSE
func main() {
	sigolo.Info("Init simple-task-manager server v" + util.VERSION)

	configureCliArgs()
	_, err := app.Parse(os.Args[1:])
	sigolo.FatalCheck(err)

	// Load config an override with CLI args
	config.LoadConfig(*appConfig)
	config.PrintConfig()

	configureLogging()

	// Init of Config, Services, Storages, etc.
	auth.Init()
	sigolo.Info("Initializes services, storages, etc.")

	err = api.Init()
	if err != nil {
		sigolo.Stack(err)
		os.Exit(1)
	}
}
