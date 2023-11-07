package main

import (
	"fmt"
	"github.com/alecthomas/kong"
	_ "github.com/lib/pq" // Make driver "postgres" usable
	"os"

	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/api"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/config"
	_ "github.com/hauke96/simple-task-manager/server/docs"
	"github.com/hauke96/simple-task-manager/server/util"
)

var cli struct {
	Config  string `help:"The config file. CLI argument override the settings from that file." short:"d" default:"./config/default.json"`
	Version bool   `help:"Print the version of STM" short:"v"`
}

func configureCliArgs() {
	kong.Name("Simple Task Manager")
	kong.Description("A tool dividing an area of the map into smaller tasks.")
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
// @description This is the SimpleTaskManager (STM) Server. See the GitHub repo '/doc/api/' for further details on authentication, websockets and changelogs.

// @contact.name STM issue tracker
// @contact.url https://github.com/hauke96/simple-task-manager/issues

// @license.name GNU General Public License 3.0
// @license.url https://github.com/hauke96/simple-task-manager/blob/master/LICENSE
func main() {
	configureCliArgs()
	kong.Parse(&cli)

	if cli.Version {
		fmt.Printf("STM - SimpleTaskManager\nVersion %s\n", util.VERSION)
		return
	}

	// Load config an override with CLI args
	sigolo.Info("Init simple-task-manager server v" + util.VERSION)
	config.LoadConfig(cli.Config)
	config.PrintConfig()

	configureLogging()

	// Init of Config, Services, Storages, etc.
	auth.Init()
	sigolo.Info("Initializes services, storages, etc.")

	err := api.Init()
	if err != nil {
		sigolo.Stack(err)
		os.Exit(1)
	}
}
