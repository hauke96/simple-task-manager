package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/pkg/errors"
	"strings"
)

type Project struct {
	Id                 string   `json:"id"`
	Name               string   `json:"name"`
	TaskIDs            []string `json:"taskIds"`
	Users              []string `json:"users"`
	Owner              string   `json:"owner"`
	Description        string   `json:"description"`
	NeedsAssignment    bool     `json:"needsAssignment"`    // When "true", the tasks of this project need to have an assigned user
	TotalProcessPoints int      `json:"totalProcessPoints"` // Sum of all maximum process points of all tasks
	DoneProcessPoints  int      `json:"doneProcessPoints"`  // Sum of all process points that have been set
}

type ProjectService struct {
	store             *storePg
	permissionService *permission.PermissionService
	taskService       *task.TaskService
}

var (
	maxDescriptionLength = 10000
)

func Init(tx *sql.Tx, taskService *task.TaskService, permissionService *permission.PermissionService) *ProjectService {
	return &ProjectService{
		store:             getStore(tx),
		permissionService: permissionService,
		taskService:       taskService,
	}
}

func (s *ProjectService) GetProjects(userId string) ([]*Project, error) {
	projects, err := s.store.getProjects(userId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting projects for user %s", userId))
	}

	for _, p := range projects {
		err = s.addMetadata(p, userId)
		if err != nil {
			return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", p.Id))
		}
	}

	return projects, nil
}

func (s *ProjectService) GetProjectByTask(taskId string, userId string) (*Project, error) {
	project, err := s.store.getProjectByTask(taskId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting project with task %s", taskId))
	}

	err = s.addMetadata(project, userId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}

// AddProject adds the project, as requested by user "userId".
func (s *ProjectService) AddProject(projectDraft *Project) (*Project, error) {
	if projectDraft.Id != "" {
		return nil, errors.New("Id not empty")
	}

	if projectDraft.Owner == "" {
		return nil, errors.New("Owner must be set")
	}

	usersContainOwner := false
	for _, u := range projectDraft.Users {
		usersContainOwner = usersContainOwner || (u == projectDraft.Owner)
	}

	if !usersContainOwner {
		return nil, errors.New("Owner must be within users list")
	}

	if projectDraft.Name == "" {
		return nil, errors.New("Project must have a title")
	}

	if len(projectDraft.TaskIDs) == 0 {
		return nil, errors.New("No tasks have been specified")
	}

	tasksAlreadyUsed, err := s.store.areTasksUsed(projectDraft.TaskIDs)
	if err != nil {
		return nil, errors.Wrap(err, "error checking whether given tasks are already used")
	}
	if tasksAlreadyUsed {
		return nil, errors.New("The given tasks are already used in other Projects")
	}

	if len(projectDraft.Description) > maxDescriptionLength {
		return nil, errors.New(fmt.Sprintf("Description too long. Maximum allowed are %d characters.", maxDescriptionLength))
	}

	// Actually add project and fill it with process point data

	project, err := s.store.addProject(projectDraft)
	if err != nil {
		return nil, errors.Wrap(err, "Unable to add projectDraft to store")
	}

	err = s.addMetadata(project, project.Owner)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}

func (s *ProjectService) GetProject(projectId string, potentialMemberId string) (*Project, error) {
	err := s.permissionService.VerifyMembershipProject(projectId, potentialMemberId)
	if err != nil {
		return nil, errors.Wrap(err, "user membership verification failed")
	}

	project, err := s.store.getProject(projectId)
	if err != nil {
		return nil, errors.Wrap(err, "getting project failed")
	}

	err = s.addMetadata(project, potentialMemberId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}

// addMetadata adds additional metadata for convenience. This includes information about process points as well as permissions.
func (s *ProjectService) addMetadata(project *Project, potentialMemberId string) error {
	tasks, err := s.GetTasks(project.Id, potentialMemberId)
	if err != nil {
		return errors.Wrap(err, "getting tasks of project failed")
	}

	// Collect the overall finish-state of the project
	for _, t := range tasks {
		project.DoneProcessPoints += t.ProcessPoints
		project.TotalProcessPoints += t.MaxProcessPoints
	}


	needsAssignment, err := s.permissionService.AssignmentInProjectNeeded(project.Id)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("unable to get assignment requirement for project %s", project.Id))
	}
	project.NeedsAssignment = needsAssignment

	return nil
}

func (s *ProjectService) AddUser(projectId, userId, potentialOwnerId string) (*Project, error) {
	err := s.permissionService.VerifyOwnership(projectId, potentialOwnerId)
	if err != nil {
		return nil, errors.Wrap(err, "userId ownership verification failed")
	}

	p, err := s.store.getProject(projectId)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get project to add userId")
	}

	// Check if userId is already in project. If so, just do nothing and return
	for _, u := range p.Users {
		if u == userId {
			return p, errors.New("User already added")
		}
	}

	project, err := s.store.addUser(projectId, userId)
	if err != nil {
		return nil, errors.Wrap(err, "getting project failed")
	}

	err = s.addMetadata(project, potentialOwnerId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}

func (s *ProjectService) LeaveProject(projectId string, potentialMemberId string) (*Project, error) {
	return s.RemoveUser(projectId, potentialMemberId, potentialMemberId)
}

func (s *ProjectService) RemoveUser(projectId, requestingUserId, userIdToRemove string) (*Project, error) {
	// Both users have to be member of the project
	err := s.permissionService.VerifyMembershipProject(projectId, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, "membership verification of requesting user failed")
	}

	err = s.permissionService.VerifyMembershipProject(projectId, userIdToRemove)
	if err != nil {
		return nil, errors.Wrap(err, "membership verification of user to remove failed")
	}

	// It's not possible to remove the owner
	err = s.permissionService.VerifyOwnership(projectId, userIdToRemove)
	if err == nil {
		return nil, errors.New("not allowed to remove owner")
	}

	err = s.permissionService.VerifyOwnership(projectId, requestingUserId)
	requestingUserIsOwner := err == nil

	// When a user tries to remove a different user, only the owner is allowed to do that
	if requestingUserId != userIdToRemove && !requestingUserIsOwner {
		return nil, fmt.Errorf("non-owner user '%s' is not allowed to remove another user", requestingUserId)
	}

	project, err := s.store.removeUser(projectId, userIdToRemove)
	if err != nil {
		return nil, err
	}

	// Unassign removed user from all tasks
	for _, t := range project.TaskIDs {
		err := s.permissionService.VerifyAssignment(t, userIdToRemove)

		// err != nil means: The user is assigned to the task 't'
		if err == nil {
			_, err := s.taskService.UnassignUser(t, userIdToRemove)

			if err != nil {
				return nil, errors.Wrap(err, fmt.Sprintf("Unable to unassign user '%s' from task '%s'", userIdToRemove, t))
			}
		}
	}

	// It could happen that someone removes him-/herself, so that we just removed requestingUserId from the project.
	// Therefore the owner is used here.
	err = s.addMetadata(project, project.Owner)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}

func (s *ProjectService) DeleteProject(projectId, potentialOwnerId string) error {
	err := s.permissionService.VerifyOwnership(projectId, potentialOwnerId)
	if err != nil {
		return errors.Wrap(err, "ownership verification failed")
	}

	project, err := s.store.getProject(projectId)
	if err != nil {
		return errors.Wrap(err, "unable to read project before removal")
	}

	// First delete the tasks, due to ownership check which won't work, when there's no project anymore.
	s.taskService.Delete(project.TaskIDs, potentialOwnerId)

	// Then remove the project
	err = s.store.delete(projectId)
	if err != nil {
		return errors.Wrap(err, "could not remove project")
	}

	return nil
}

// TODO move into task package, pass task IDs as parameter and use the permission service to check the permissions on those tasks
func (s *ProjectService) GetTasks(projectId string, userId string) ([]*task.Task, error) {
	err := s.permissionService.VerifyMembershipProject(projectId, userId)
	if err != nil {
		return nil, errors.Wrap(err, "membership verification failed")
	}

	return s.store.getTasks(projectId, userId, s.taskService)
}

func (s *ProjectService) UpdateName(projectId string, newName string, requestingUserId string) (*Project, error) {
	err := s.permissionService.VerifyOwnership(projectId, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, "membership verification of requesting user failed")
	}

	lines := strings.Split(newName, "\n")
	newName = lines[0]

	if len(strings.TrimSpace(newName)) == 0 {
		return nil, errors.New("No name specified")
	}

	project, err := s.store.updateName(projectId, newName)
	if err != nil {
		return nil, errors.Wrap(err, "getting project failed")
	}

	err = s.addMetadata(project, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}

func (s *ProjectService) UpdateDescription(projectId string, newDescription string, requestingUserId string) (*Project, error) {
	err := s.permissionService.VerifyOwnership(projectId, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, "membership verification of requesting user failed")
	}

	if len(strings.TrimSpace(newDescription)) == 0 {
		return nil, errors.New("No description specified")
	}

	project, err := s.store.updateDescription(projectId, newDescription)
	if err != nil {
		return nil, errors.Wrap(err, "getting project failed")
	}

	err = s.addMetadata(project, requestingUserId)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Unable to add process point data to project %s", project.Id))
	}

	return project, nil
}
