package main

import (
	"fmt"
	"github.com/hauke96/kingpin"
	"github.com/hauke96/sigolo"
	_ "github.com/lib/pq" // Make driver "postgres" usable
	"os"

	"github.com/hauke96/simple-task-manager/server/api"
	"github.com/hauke96/simple-task-manager/server/auth"
	"github.com/hauke96/simple-task-manager/server/config"
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

func main() {
	sigolo.Info("Init simple-task-manager server v" + util.VERSION)

	configureCliArgs()
	_, err := app.Parse(os.Args[1:])
	sigolo.FatalCheck(err)

	// Load config an override with CLI args
	config.LoadConfig(*appConfig)

	configureLogging()

	// Init of Config, Services, Storages, etc.
	auth.Init()
	sigolo.Info("Initializes services, storages, etc.")

	err = api.Init()
	if err != nil {
		sigolo.Error(fmt.Sprintf("Error while serving: %s", err))
	}
}
