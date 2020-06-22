package database

import (
	"database/sql"
	"github.com/hauke96/sigolo"

	_ "github.com/lib/pq"
)

var (
	db *sql.DB
)

func GetTransaction() (*sql.Tx, error) {
	if db == nil {
		dbConn, err := sql.Open("postgres", "user=postgres password=geheim dbname=stm sslmode=disable")
		sigolo.FatalCheck(err)

		db = dbConn
	}

	return db.Begin()
}
