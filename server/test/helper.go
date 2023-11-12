package test

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	_ "github.com/lib/pq" // Make driver "postgres" usable
	"github.com/pkg/errors"
	"os"
	"testing"
)

type TestHelper struct {
	Tx    *sql.Tx // Transaction for the test run. Will be rolled back at the end.
	Setup func()

	db *sql.DB // DB connection for the test run
}

func NewTestHelper(setupFunc func()) *TestHelper {
	return &TestHelper{
		Setup: setupFunc,
	}
}

// Load dummy data into the database.
func (h *TestHelper) InitWithDummyData(dbUsername, dbPassword, dbDatabase string) {
	sigolo.Info("Add database dummy data")

	var err error
	h.db, err = sql.Open("postgres", fmt.Sprintf("user=%s password=%s dbname=%s sslmode=disable", dbUsername, dbPassword, dbDatabase))
	if err != nil {
		sigolo.Fatal("Unable to connect to database: %s", err.Error())
	}

	// Working directory when executing tests is the actual package folder, so we have to manually fo into "test" folder for the dump
	fileBytes, err := os.ReadFile("../test/dump.sql")
	if err != nil {
		sigolo.Fatal("Unable to read dump.sql: %s", err.Error())
	}

	_, err = h.db.Exec(string(fileBytes))
	if err != nil {
		sigolo.Fatal("Unable to execute dump.sql: %s", err.Error())
	}

	sigolo.Info("Adding dummy data completed")
}

func (h *TestHelper) NewTransaction() *sql.Tx {
	var err error
	h.Tx, err = h.db.Begin()
	if err != nil {
		panic(err)
	}
	return h.Tx
}

func (h *TestHelper) Run(t *testing.T, testFunc func() error) {
	if h.Setup != nil {
		h.Setup()
	}

	err := testFunc()
	if err != nil {
		t.Errorf("%+v", err)
		t.Fail()
	}

	h.tearDown()
}

func (h *TestHelper) RunFail(t *testing.T, testFunc func() error) {
	h.Setup()

	err := testFunc()
	if err != nil {
		t.Errorf("%+v", err)
		t.Fail()
	}

	h.tearDownFail()
}

func (h *TestHelper) tearDown() {
	if h.Tx == nil {
		return
	}

	err := h.Tx.Rollback()
	if err != nil {
		panic(err)
	}

	err = h.db.Close()
	if err != nil {
		panic(err)
	}
}

func (h *TestHelper) tearDownFail() {
	if h.Tx == nil {
		return
	}

	err := h.Tx.Rollback()
	if err == nil {
		panic(errors.New("expected database error and rollback but not occurred"))
	}

	err = h.db.Close()
	if err != nil {
		panic(err)
	}
}
