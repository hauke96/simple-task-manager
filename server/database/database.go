package database

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	_ "github.com/lib/pq"
	"github.com/pkg/errors"
)

var (
	db *sql.DB
)

// GetTransaction tries to open to the database and creates a transaction. Only if the initial connection succeeds,
// a reconnect loop starts.
func GetTransaction() (*sql.Tx, error) {
	if db == nil { // No database connection at all
		err := open()
		if err != nil {
			sigolo.Error("Opening initial DB connection failed")
			return nil, err
		}
	} else if err := db.Ping(); err != nil { // Check the DB connection is broken and try to reconnect
		sigolo.Error("DB ping check failed with error: %s", err.Error())
		sigolo.Info("Try to reconnect...")

		err := open()
		if err != nil {
			sigolo.Error("Reconnect failed")
			return nil, err
		}

		sigolo.Info("Successfully created new database connection")
	}

	return db.Begin()
}

// open tries to open to the database and performs a simple health-check by using the "Ping" function on the database.
// Only if the check was successful, the "db" variable is set.
func open() error {
	dbConn, err := sql.Open("postgres", fmt.Sprintf("user=%s password=%s dbname=stm sslmode=disable", config.Conf.DbUsername, config.Conf.DbPassword))
	if err != nil {
		return errors.Wrap(err, "unable to open database connection")
	}

	err = dbConn.Ping()
	if err != nil {
		return errors.Wrap(err, "ping on newly opened database connection failed")
	}

	db = dbConn
	return nil
}
