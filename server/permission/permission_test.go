package permission

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/database"
	"github.com/hauke96/simple-task-manager/server/test"
	"github.com/hauke96/simple-task-manager/server/util"
	"testing"

	_ "github.com/lib/pq" // Make driver "postgres" usable
)

var (
	tx *sql.Tx
	s  *PermissionService
	h  *test.TestHelper
)

func TestMain(m *testing.M) {
	h = &test.TestHelper{
		Setup: setup,
	}

	m.Run()
}

func setup() {
	config.LoadConfig("../config/test.json")
	test.InitWithDummyData(config.Conf.DbUsername, config.Conf.DbPassword)
	sigolo.LogLevel = sigolo.LOG_DEBUG

	logger := util.NewLogger()

	var err error
	tx, err = database.GetTransaction(logger)
	if err != nil {
		panic(err)
	}

	h.Tx = tx
	s = Init(tx, logger)
}

func TestVerifyOwnership(t *testing.T) {
	h.Run(t, func() error {
		err := s.VerifyOwnership("1", "Peter")
		if err != nil {
			return fmt.Errorf("This should work: %s", err.Error())
		}

		// With existing user who is not the owner

		err = s.VerifyOwnership("1", "Maria")
		if err == nil {
			return fmt.Errorf("Maria is not the owner")
		}

		// With not existing user

		err = s.VerifyOwnership("1", "Pete")
		if err == nil {
			return fmt.Errorf("Pete is not even an existing user")
		}

		// With non existing project

		err = s.VerifyOwnership("143536", "Peter")
		if err == nil {
			return fmt.Errorf("This project not even exists")
		}

		return nil
	})
}

func TestVerifyMembershipProject(t *testing.T) {
	h.Run(t, func() error {
		err := s.VerifyMembershipProject("1", "Peter")
		if err != nil {
			return fmt.Errorf("Peter is indeed a member: %s", err.Error())
		}

		// non-owner user but still a member

		err = s.VerifyMembershipProject("1", "Maria")
		if err != nil {
			return fmt.Errorf("Maria is indeed a member: %s", err.Error())
		}

		// not a member

		err = s.VerifyMembershipProject("1", "John")
		if err == nil {
			return fmt.Errorf("John is not a member")
		}

		// not existing project

		err = s.VerifyMembershipProject("1345436", "Peter")
		if err == nil {
			return fmt.Errorf("Not existing project, this should not work")
		}

		return nil
	})
}

func TestVerifyMembershipTask(t *testing.T) {
	h.Run(t, func() error {
		err := s.VerifyMembershipTask("2", "Maria")
		if err != nil {
			return fmt.Errorf("Maria is indeed a member: %s", err.Error())
		}

		// non-owner user but still a member

		err = s.VerifyMembershipTask("3", "John")
		if err != nil {
			return fmt.Errorf("John is indeed a member: %s", err.Error())
		}

		// not a member

		err = s.VerifyMembershipTask("3", "who ever")
		if err == nil {
			return fmt.Errorf("'who ever' is not a member")
		}

		// not existing project

		err = s.VerifyMembershipTask("1345436", "Maria")
		if err == nil {
			return fmt.Errorf("Not existing task, this should not work")
		}

		return nil
	})
}

func TestVerifyMembershipTasks(t *testing.T) {
	h.Run(t, func() error {
		err := s.VerifyMembershipTasks([]string{"2", "3"}, "Clara")
		if err != nil {
			return fmt.Errorf("User 'Clara' is in deed a member of the project of tasks '2' and '3': %s", err.Error())
		}

		// Not a member

		err = s.VerifyMembershipTasks([]string{"1", "5"}, "Clara")
		if err == nil {
			return fmt.Errorf("User 'Clara' is NOT a member of the project fo task '1'")
		}

		// Not existing task

		err = s.VerifyMembershipTasks([]string{"34561", "-1"}, "Clara")
		if err == nil {
			return fmt.Errorf("The task '34561' doesn't exist and 'Clara' should not be a member of this")
		}

		return nil
	})
}

func TestVerifyAssignment(t *testing.T) {
	h.Run(t, func() error {
		err := s.VerifyAssignment("1", "Peter")
		if err != nil {
			return fmt.Errorf("User 'Peter' is in deed assigned to task '1': %s", err.Error())
		}

		// Not assigned
		err = s.VerifyAssignment("2", "Clara")
		if err == nil {
			return fmt.Errorf("User 'Clara' is in NOT assigned to task '2'")
		}

		// Not existing task
		err = s.VerifyAssignment("875435", "Clara")
		if err == nil {
			return fmt.Errorf("User 'Clara' should not be treated as 'assigned' to not existing task '875435'")
		}

		return nil
	})
}

func TestAssignmentInProjectNeeded(t *testing.T) {
	h.Run(t, func() error {
		assignmentNeeded, err := s.AssignmentInProjectNeeded("3")
		if err != nil {
			return fmt.Errorf("Error getting assignment requirement")
		}

		if assignmentNeeded {
			return fmt.Errorf("Should not need assignments")
		}

		// project with multiple users

		assignmentNeeded, err = s.AssignmentInProjectNeeded("2")
		if err != nil {
			return fmt.Errorf("Error getting assignment requirement")
		}

		if !assignmentNeeded {
			return fmt.Errorf("Should need assignments")
		}

		return nil
	})
}

func TestAssignmentInTaskNeeded(t *testing.T) {
	h.Run(t, func() error {
		// Assignment not needed
		needed, err := s.AssignmentInTaskNeeded("5")
		if needed {
			return fmt.Errorf("Task '5' doesn't need an assignment")
		}
		if err != nil {
			return fmt.Errorf("Getting assignment requirement should work: %s", err.Error())
		}

		// Assignment needed
		needed, err = s.AssignmentInTaskNeeded("3")
		if !needed {
			return fmt.Errorf("Task '3' does need an assignment")
		}
		if err != nil {
			return fmt.Errorf("Getting assignment requirement should work: %s", err.Error())
		}

		// Not existing task
		needed, err = s.AssignmentInTaskNeeded("84675")
		if !needed {
			return fmt.Errorf("Not existing task '84675' should need an assignment by default")
		}
		if err == nil {
			return fmt.Errorf("Getting assignment requirement for not existing task '84675' should not work")
		}

		return nil
	})
}
