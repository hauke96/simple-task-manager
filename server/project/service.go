package project

import (
	"database/sql"
	"fmt"
	"github.com/pkg/errors"
	"stm/comment"
	"stm/config"
	"stm/permission"
	"stm/task"
	"stm/util"
	"strings"
	"time"
)

type ProjectService struct {
	*util.Logger
	store           *storePg
	permissionStore *permission.PermissionStore
	taskService     *task.TaskService
	commentService  *comment.CommentService
}

func Init(tx *sql.Tx, logger *util.Logger, taskService *task.TaskService, permissionStore *permission.PermissionStore, commentService *comment.CommentService, commentStore *comment.CommentStore) *ProjectService {
	return &ProjectService{
		Logger:          logger,
		store:           getStore(tx, logger, task.GetStore(tx, logger, commentStore), commentStore),
		permissionStore: permissionStore,
		taskService:     taskService,
		commentService:  commentService,
	}
}

func (s *ProjectService) GetProjects(userId string) ([]*Project, error) {
	projects, err := s.store.getAllProjectsOfUser(userId)
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
	project, err := s.store.getProjectOfTask(taskId)
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
	err := s.permissionStore.VerifyMembershipProject(projectId, potentialMemberId)
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

	needsAssignment, err := s.permissionStore.AssignmentInProjectNeeded(project.Id)
	if err != nil {
		s.Err("unable to get assignment requirement for project %s", project.Id)
		return err
	}
	project.NeedsAssignment = needsAssignment

	s.Log("Added task metadata to project %s", project.Id)

	return nil
}

func (s *ProjectService) AddUser(projectId, userId, potentialOwnerId string) (*Project, error) {
	err := s.permissionStore.VerifyOwnership(projectId, potentialOwnerId)
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
	err := s.permissionStore.VerifyMembershipProject(projectId, requestingUserId)
	if err != nil {
		return nil, err
	}

	err = s.permissionStore.VerifyMembershipProject(projectId, userIdToRemove)
	if err != nil {
		return nil, err
	}

	// It's not possible to remove the owner
	err = s.permissionStore.VerifyOwnership(projectId, userIdToRemove)
	if err == nil {
		return nil, errors.New("removing the owner is not allowed")
	}

	err = s.permissionStore.VerifyOwnership(projectId, requestingUserId)
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
		err := s.permissionStore.VerifyCanUnassign(t.Id, userIdToRemove)

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
	err := s.permissionStore.VerifyOwnership(projectId, potentialOwnerId)
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
	err := s.permissionStore.VerifyOwnership(projectId, requestingUserId)
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
	err := s.permissionStore.VerifyOwnership(projectId, requestingUserId)
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

func (s *ProjectService) AddComment(projectId string, draftDto *comment.CommentDraftDto, authorId string) (*comment.Comment, error) {
	commentListId, err := s.store.getCommentListId(projectId)
	if err != nil {
		return nil, err
	}

	return s.commentService.AddComment(commentListId, draftDto, authorId)
}
