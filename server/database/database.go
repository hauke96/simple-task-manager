package database

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/config"
	_ "github.com/lib/pq"
)

var (
	db *sql.DB
)

func GetTransaction() (*sql.Tx, error) {
	if db == nil {
		dbConn, err := sql.Open("postgres", fmt.Sprintf("user=%s password=%s dbname=stm sslmode=disable", config.Conf.DbUsername, config.Conf.DbPassword))
		if err != nil{
			return nil, err
		}

		db = dbConn
	}

	return db.Begin()
}
