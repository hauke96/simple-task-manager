package project

import (
	"database/sql"
	"fmt"
	"github.com/hauke96/simple-task-manager/server/config"
	"github.com/hauke96/simple-task-manager/server/permission"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"github.com/pkg/errors"
	"strings"
	"time"
)

type ProjectDraftDto struct {
	Name        string   `json:"name"`        // Name of the project. Must not be NULL or empty.
	Description string   `json:"description"` // Description of the project. Must not be NULL but cam be empty.
	Users       []string `json:"users"`       // A non-empty list of user-IDs. At least the owner should be in here.
	Owner       string   `json:"owner"`       // The user-ID who created this project. Must not be NULL or empty.
}

type Project struct {
	Id                 string       `json:"id"`                 // The ID of the project.
	Name               string       `json:"name"`               // The name of the project. Will not be NULL or empty.
	Tasks              []*task.Task `json:"tasks"`              // List of tasks of the project. Will not be NULL or empty.
	Users              []string     `json:"users"`              // Array of user-IDs (=members of this project). Will not be NULL or empty.
	Owner              string       `json:"owner"`              // User-ID of the owner/creator of this project. Will not be NULL or empty.
	Description        string       `json:"description"`        // Some description, can be empty. Will not be NULL but might be empty.
	NeedsAssignment    bool         `json:"needsAssignment"`    // When "true", the tasks of this project need to have an assigned user.
	TotalProcessPoints int          `json:"totalProcessPoints"` // Sum of all maximum process points of all tasks.
	DoneProcessPoints  int          `json:"doneProcessPoints"`  // Sum of all process points that have been set. It applies "0 <= doneProcessPoints <= totalProcessPoints".
	CreationDate       *time.Time   `json:"creationDate"`       // UTC Date in RFC 3339 format, can be NIL because of old data in the database. Example: "2006-01-02 15:04:05.999999999 -0700 MST"
}

type ProjectService struct {
	*util.Logger
	store             *storePg
	permissionService *permission.PermissionService
	taskService       *task.TaskService
}

func Init(tx *sql.Tx, logger *util.Logger, taskService *task.TaskService, permissionService *permission.PermissionService) *ProjectService {
	return &ProjectService{
		Logger:            logger,
		store:             getStore(tx, task.GetStore(tx, logger), logger),
		permissionService: permissionService,
		taskService:       taskService,
	}
}

func (s *ProjectService) GetProjects(userId string) ([]*Project, error) {
	projects, err := s.store.getProjects(userId)
	if err != nil {
		s.Err(fmt.Sprintf("Error getting projects for user %s", userId))
		return nil, err
	}

	for _, p := range projects {
		err = s.addTasksAndMetadata(p)
		if err != nil {
			s.Err("Unable to add process point data to project %s", p.Id)
			return nil, err
		}
	}

	return projects, nil
}

func (s *ProjectService) GetProjectByTask(taskId string) (*Project, error) {
	project, err := s.store.getProjectByTask(taskId)
	if err != nil {
		s.Err("Error getting project with task %s", taskId)
		return nil, err
	}

	err = s.addTasksAndMetadata(project)
	if err != nil {
		s.Err("Unable to add process point data to project %s", project.Id)
		return nil, err
	}

	return project, nil
}

// AddProjectWithTasks takes the project and the tasks and adds them to the database. This also adds the process-point
// metadata to the returned project.
func (s *ProjectService) AddProjectWithTasks(projectDraft *ProjectDraftDto, taskDrafts []task.TaskDraftDto) (*Project, error) {
	if len(taskDrafts) > config.Conf.MaxTasksPerProject {
		return nil, errors.New(fmt.Sprintf("Maximum %d tasks allowed", config.Conf.MaxTasksPerProject))
	}

	// Store project
	addedProject, err := s.AddProject(projectDraft)
	if err != nil {
		return nil, err
	}
	s.Log("Added project %s", addedProject.Id)

	// Store tasks
	tasks, err := s.taskService.AddTasks(taskDrafts, addedProject.Id)
	if err != nil {
		return nil, err
	}
	addedProject.Tasks = tasks
	s.Log("Added tasks")

	// Add Metadata now, that we have tasks
	err = s.addTasksAndMetadata(addedProject)
	if err != nil {
		return nil, err
	}

	return addedProject, nil
}

// AddProject adds the project, as requested by user "userId". This does NOT fill the metadata information because
// there're not necessarily tasks yet.
func (s *ProjectService) AddProject(projectDraft *ProjectDraftDto) (*Project, error) {
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

	if len(projectDraft.Description) > config.Conf.MaxDescriptionLength {
		return nil, errors.New(fmt.Sprintf("Description too long. Allowed are %d characters but found %d.", config.Conf.MaxDescriptionLength, len(projectDraft.Description)))
	}

	// Actually add project
	project, err := s.store.addProject(projectDraft, time.Now().UTC())
	if err != nil {
		return nil, err
	}
	s.Log("Added project %s", project.Id)

	return project, nil
}

func (s *ProjectService) GetProject(projectId string, potentialMemberId string) (*Project, error) {
	err := s.permissionService.VerifyMembershipProject(projectId, potentialMemberId)
	if err != nil {
		return nil, err
	}

	project, err := s.store.getProject(projectId)
	if err != nil {
		return nil, err
	}

	err = s.addTasksAndMetadata(project)
	if err != nil {
		s.Err("Unable to add process point data to project %s", project.Id)
		return nil, err
	}

	return project, nil
}

// addTasksAndMetadata adds additional metadata for convenience. This includes information about process points as well as permissions.
func (s *ProjectService) addTasksAndMetadata(project *Project) error {
	// Collect the overall finish-state of the project
	for _, t := range project.Tasks {
		project.DoneProcessPoints += t.ProcessPoints
		project.TotalProcessPoints += t.MaxProcessPoints
	}

	needsAssignment, err := s.permissionService.AssignmentInProjectNeeded(project.Id)
	if err != nil {
		s.Err("unable to get assignment requirement for project %s", project.Id)
		return err
	}
	project.NeedsAssignment = needsAssignment

	s.Log("Added task metadata to project %s", project.Id)

	return nil
}

func (s *ProjectService) AddUser(projectId, userId, potentialOwnerId string) (*Project, error) {
	err := s.permissionService.VerifyOwnership(projectId, potentialOwnerId)
	if err != nil {
		return nil, err
	}

	p, err := s.store.getProject(projectId)
	if err != nil {
		return nil, err
	}

	// Check if userId is already in project. If so, just do nothing and return
	for _, u := range p.Users {
		if u == userId {
			return p, errors.New("User already added")
		}
	}

	project, err := s.store.addUser(projectId, userId)
	if err != nil {
		return nil, err
	}
	s.Log("Added user to project %s", project.Id)

	err = s.addTasksAndMetadata(project)
	if err != nil {
		s.Err("Unable to add process point data to project %s", project.Id)
		return nil, err
	}

	return project, nil
}

func (s *ProjectService) RemoveUser(projectId, requestingUserId, userIdToRemove string) (*Project, error) {
	// Both users have to be member of the project
	// TODO I think this is unnecessary: First check whether requestingUserId == userIdToRemove
	err := s.permissionService.VerifyMembershipProject(projectId, requestingUserId)
	if err != nil {
		return nil, err
	}

	err = s.permissionService.VerifyMembershipProject(projectId, userIdToRemove)
	if err != nil {
		return nil, err
	}

	// It's not possible to remove the owner
	err = s.permissionService.VerifyOwnership(projectId, userIdToRemove)
	if err == nil {
		return nil, errors.New("removing the owner is not allowed")
	}

	err = s.permissionService.VerifyOwnership(projectId, requestingUserId)
	requestingUserIsOwner := err == nil

	// When a user tries to remove a different user, only the owner is allowed to do that
	if requestingUserId != userIdToRemove && !requestingUserIsOwner {
		return nil, errors.New(fmt.Sprintf("non-owner user '%s' is not allowed to remove another user", requestingUserId))
	}

	project, err := s.store.removeUser(projectId, userIdToRemove)
	if err != nil {
		return nil, err
	}
	s.Log("User removed from project %s", project.Id)

	// Unassign removed user from all tasks
	newTasks := make([]*task.Task, len(project.Tasks))
	for i, t := range project.Tasks {
		err := s.permissionService.VerifyAssignment(t.Id, userIdToRemove)

		// err != nil means: The user is assigned to the task 't'
		if err == nil {
			updatedTask, err := s.taskService.UnassignUser(t.Id, userIdToRemove)
			if err != nil {
				s.Err("Unable to unassign user '%s' from task '%s'", userIdToRemove, t.Id)
				return nil, err
			}
			s.Log("Unassigned user %s from task %s", userIdToRemove, t.Id)

			newTasks[i] = updatedTask
		} else {
			newTasks[i] = t
		}
	}
	project.Tasks = newTasks
	s.Log("Unassigned the removed user %s from all tasks of project %s", userIdToRemove, project.Id)

	// It could happen that someone removes him-/herself, so that we just removed requestingUserId from the project.
	// Therefore the owner is used here.
	err = s.addTasksAndMetadata(project)
	if err != nil {
		s.Err("Unable to add process point data to project %s", project.Id)
		return nil, err
	}

	return project, nil
}

func (s *ProjectService) DeleteProject(projectId, potentialOwnerId string) error {
	err := s.permissionService.VerifyOwnership(projectId, potentialOwnerId)
	if err != nil {
		return err
	}

	// Then remove the project
	err = s.store.delete(projectId)
	if err != nil {
		return err
	}
	s.Log("Deleted project %s", projectId)

	return nil
}

func (s *ProjectService) UpdateName(projectId string, newName string, requestingUserId string) (*Project, error) {
	err := s.permissionService.VerifyOwnership(projectId, requestingUserId)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(newName, "\n")
	newName = lines[0]

	if len(strings.TrimSpace(newName)) == 0 {
		return nil, errors.New("No name specified")
	}

	project, err := s.store.updateName(projectId, newName)
	if err != nil {
		return nil, err
	}
	s.Log("Updated name of project %s to '%s'", project.Id, newName)

	err = s.addTasksAndMetadata(project)
	if err != nil {
		s.Err("Unable to add process point data to project %s", project.Id)
		return nil, err
	}

	return project, nil
}

func (s *ProjectService) UpdateDescription(projectId string, newDescription string, requestingUserId string) (*Project, error) {
	err := s.permissionService.VerifyOwnership(projectId, requestingUserId)
	if err != nil {
		return nil, err
	}

	if len(strings.TrimSpace(newDescription)) == 0 {
		return nil, errors.New("No description specified")
	}

	if len(newDescription) > config.Conf.MaxDescriptionLength {
		return nil, errors.New(fmt.Sprintf("Description too long. Allowed are %d characters but found %d.", config.Conf.MaxDescriptionLength, len(newDescription)))
	}

	project, err := s.store.updateDescription(projectId, newDescription)
	if err != nil {
		return nil, err
	}
	s.Log("Updated description of project %s", project.Id)

	err = s.addTasksAndMetadata(project)
	if err != nil {
		s.Err("Unable to add process point data to project %s", project.Id)
		return nil, err
	}

	return project, nil
}
