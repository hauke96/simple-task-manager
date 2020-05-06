package permission

import (
	"flag"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"testing"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

var useDatabase = flag.Bool("with-db", false, "Whether to use the database as well (next to the cache) or not")

func prepare() {
	config.Conf = &config.Config{
		Store: "postgres",
	}

	sigolo.LogLevel = sigolo.LOG_DEBUG
	Init()
}

func TestVerifyOwnership(t *testing.T) {
	prepare()

	err := VerifyOwnership("1", "Peter")
	if err != nil {
		t.Errorf("This should work: %s", err.Error())
		t.Fail()
		return
	}

	// With existing user who is not the owner

	err = VerifyOwnership("1", "Maria")
	if err == nil {
		t.Errorf("Maria is not the owner")
		t.Fail()
		return
	}

	// With not existing user

	err = VerifyOwnership("1", "Pete")
	if err == nil {
		t.Errorf("Pete is not even an existing user")
		t.Fail()
		return
	}

	// With non existing project

	err = VerifyOwnership("143536", "Peter")
	if err == nil {
		t.Errorf("This project not even exists")
		t.Fail()
		return
	}
}

func TestVerifyMembershipProject(t *testing.T) {
	err := VerifyMembershipProject("1", "Peter")
	if err != nil {
		t.Errorf("Peter is indeed a member: %s", err.Error())
		t.Fail()
		return
	}

	// non-owner user but still a member

	err = VerifyMembershipProject("1", "Maria")
	if err != nil {
		t.Errorf("Maria is indeed a member: %s", err.Error())
		t.Fail()
		return
	}

	// not a member

	err = VerifyMembershipProject("1", "John")
	if err == nil {
		t.Errorf("John is not a member")
		t.Fail()
		return
	}

	// not existing project

	err = VerifyMembershipProject("1345436", "Peter")
	if err == nil {
		t.Errorf("Not existing project, this should not work")
		t.Fail()
		return
	}
}

func TestVerifyMembershipTask(t *testing.T) {
	err := VerifyMembershipTask("2", "Maria")
	if err != nil {
		t.Errorf("Maria is indeed a member: %s", err.Error())
		t.Fail()
		return
	}

	// non-owner user but still a member

	err = VerifyMembershipTask("3", "John")
	if err != nil {
		t.Errorf("John is indeed a member: %s", err.Error())
		t.Fail()
		return
	}

	// not a member

	err = VerifyMembershipTask("3", "who ever")
	if err == nil {
		t.Errorf("'who ever' is not a member")
		t.Fail()
		return
	}

	// not existing project

	err = VerifyMembershipTask("1345436", "Maria")
	if err == nil {
		t.Errorf("Not existing task, this should not work")
		t.Fail()
		return
	}
}

// TODO VerifyMembershipTasks

// TODO VerifyAssignment

func TestAssignmentInProjectNeeded(t *testing.T) {
	assignmentNeeded, err := AssignmentInProjectNeeded("3")
	if err != nil {
		t.Error("Error getting assignment requirement")
		t.Fail()
		return
	}

	if assignmentNeeded {
		t.Error("Should not need assignments")
		t.Fail()
		return
	}

	// project with multiple users

	assignmentNeeded, err = AssignmentInProjectNeeded("2")
	if err != nil {
		t.Error("Error getting assignment requirement")
		t.Fail()
		return
	}

	if !assignmentNeeded {
		t.Error("Should need assignments")
		t.Fail()
		return
	}
}

// TODO AssignmentInTaskNeeded