package export

import (
	"stm/project"
	"stm/task"
	"stm/util"
)

type Service struct {
	*util.Logger
	projectService *project.Service
}

func Init(logger *util.Logger, projectService *project.Service) *Service {
	return &Service{
		Logger:         logger,
		projectService: projectService,
	}
}

func (s *Service) ExportProject(projectId string, potentialMemberId string) (*ProjectExport, error) {
	project, err := s.projectService.GetProject(projectId, potentialMemberId)
	if err != nil {
		return nil, err
	}

	return toProjectExport(project), nil
}

func (s *Service) ImportProject(projectExport *ProjectExport, requestingUserId string) (*project.Project, error) {
	// Determine if the requesting user is part of this project. If not, then add him/her. It wouldn't make much sense
	//if the requesting user won't be part of the project
	alreadyContainsUser := false
	for _, u := range projectExport.Users {
		if u == requestingUserId {
			alreadyContainsUser = true
			break
		}
	}
	if !alreadyContainsUser {
		projectExport.Users = append(projectExport.Users, requestingUserId)
	}

	projectDraftDto := &project.DraftDto{
		Name:        projectExport.Name,
		Description: projectExport.Description,
		Users:       projectExport.Users,
		Owner:       requestingUserId,
	}

	taskDraftDtos := make([]task.DraftDto, len(projectExport.Tasks))
	for i := 0; i < len(projectExport.Tasks); i++ {
		t := projectExport.Tasks[i]
		taskDraftDtos[i] = task.DraftDto{
			MaxProcessPoints: t.MaxProcessPoints,
			ProcessPoints:    t.ProcessPoints,
			Geometry:         t.Geometry,
		}
	}

	return s.projectService.AddProjectWithTasks(projectDraftDto, taskDraftDtos)
}

func toProjectExport(project *project.Project) *ProjectExport {
	return &ProjectExport{
		Name:         project.Name,
		Users:        project.Users,
		Owner:        project.Owner,
		Description:  project.Description,
		CreationDate: project.CreationDate,
		Tasks:        toTaskExport(project.Tasks),
	}
}

func toTaskExport(tasks []*task.Task) []*TaskExport {
	taskExport := make([]*TaskExport, len(tasks))

	for i := 0; i < len(tasks); i++ {
		task := tasks[i]
		taskExport[i] = &TaskExport{
			Name:             task.Name,
			ProcessPoints:    task.ProcessPoints,
			MaxProcessPoints: task.MaxProcessPoints,
			Geometry:         task.Geometry,
			AssignedUser:     task.AssignedUser,
		}
	}

	return taskExport
}
