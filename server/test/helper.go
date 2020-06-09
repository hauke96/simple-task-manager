package test

import (
	"database/sql"
	"github.com/hauke96/sigolo"
	_ "github.com/lib/pq" // Make driver "postgres" usable
	"io/ioutil"
)

// Load dummy data into the database.
func InitWithDummyData() {
	sigolo.Info("Add database dummy data")

	db, err := sql.Open("postgres", "user=postgres password=geheim dbname=stm sslmode=disable")
	if err != nil {
		sigolo.Fatal("Unable to connect to database: %s", err.Error())
	}
	defer db.Close()

	// Working directory when executing tests is the actual package folder, so we have to manually fo into "test" folder for the dump
	fileBytes, err := ioutil.ReadFile("../test/dump.sql")
	if err != nil {
		sigolo.Fatal("Unable to read dump.sql: %s", err.Error())
	}

	_, err = db.Exec(string(fileBytes))
	if err != nil {
		sigolo.Fatal("Unable to execute dump.sql: %s", err.Error())
	}

	sigolo.Info("Adding dummy data completed")
}