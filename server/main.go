package main

import (
	"fmt"
	"github.com/alecthomas/kong"
	_ "github.com/lib/pq" // Make driver "postgres" usable
	"os"
	"stm/oauth2"

	"github.com/hauke96/sigolo"
	"stm/api"
	"stm/config"
	_ "stm/docs"
	"stm/util"
)

var cli struct {
	Config  string `help:"The config file. CLI argument override the settings from that file." short:"c" default:"./config/default.json"`
	Version bool   `help:"Print the version of STM" short:"v"`
	Debug   bool   `help:"Use debug logging" short:"d"`
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

	if cli.Debug {
		sigolo.LogLevel = sigolo.LOG_DEBUG
	}

	// Load config an override with CLI args
	sigolo.Info("Init simple-task-manager server v" + util.VERSION)
	config.LoadConfig(cli.Config)
	config.PrintConfig()

	configureLogging()

	// Init of Config, Services, Storages, etc.
	oauth2.Init()
	sigolo.Info("Initializes services, storages, etc.")

	err := api.Init()
	if err != nil {
		sigolo.Stack(err)
		os.Exit(1)
	}
}
