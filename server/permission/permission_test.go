package permission

import (
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"testing"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

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

func TestVerifyMembershipTasks(t *testing.T) {
	err := VerifyMembershipTasks([]string{"2", "3"}, "Clara")
	if err != nil {
		t.Errorf("User 'Clara' is in deed a member of the project of tasks '2' and '3': %s", err.Error())
		t.Fail()
		return
	}

	// Not a member

	err = VerifyMembershipTasks([]string{"1", "5"}, "Clara")
	if err == nil {
		t.Error("User 'Clara' is NOT a member of the project fo task '1'")
		t.Fail()
		return
	}

	// Not existing task

	err = VerifyMembershipTasks([]string{"34561", "-1"}, "Clara")
	if err == nil {
		t.Error("The task '34561' doesn't exist and 'Clara' should not be a member of this")
		t.Fail()
		return
	}
}

func TestVerifyAssignment(t *testing.T) {
	err := VerifyAssignment("1", "Peter")
	if err != nil {
		t.Errorf("User 'Peter' is in deed assigned to task '1': %s", err.Error())
		t.Fail()
		return
	}

	// Not assigned
	err = VerifyAssignment("2", "Clara")
	if err == nil {
		t.Errorf("User 'Clara' is in NOT assigned to task '2'")
		t.Fail()
		return
	}

	// Not existing task
	err = VerifyAssignment("875435", "Clara")
	if err == nil {
		t.Errorf("User 'Clara' should not be treated as 'assigned' to not existing task '875435'")
		t.Fail()
		return
	}
}

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

func TestAssignmentInTaskNeeded(t *testing.T) {
	// Assignment not needed
	needed, err := AssignmentInTaskNeeded("5")
	if needed {
		t.Error("Task '5' doesn't need an assignment")
		t.Fail()
		return
	}
	if err != nil {
		t.Errorf("Getting assignment requirement should work: %s", err.Error())
		t.Fail()
		return
	}

	// Assignment needed
	needed, err = AssignmentInTaskNeeded("3")
	if !needed {
		t.Error("Task '3' does need an assignment")
		t.Fail()
		return
	}
	if err != nil {
		t.Errorf("Getting assignment requirement should work: %s", err.Error())
		t.Fail()
		return
	}

	// Not existing task
	needed, err = AssignmentInTaskNeeded("84675")
	if !needed {
		t.Error("Not existing task '84675' should need an assignment by default")
		t.Fail()
		return
	}
	if err == nil {
		t.Error("Getting assignment requirement for not existing task '84675' should not work")
		t.Fail()
		return
	}
}
