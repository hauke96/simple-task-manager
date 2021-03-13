package export

import (
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"time"
)

type ProjectExport struct {
	Name         string `json:"name"`
	Users        []string `json:"users"`
	Owner        string `json:"owner"`
	Description  string `json:"description"`
	CreationDate *time.Time `json:"creationDate"`
	Tasks        []*TaskExport `json:"tasks"`
}

type TaskExport struct {
	Name             string `json:"name"`
	ProcessPoints    int `json:"processPoints"`
	MaxProcessPoints int `json:"maxProcessPoints"`
	Geometry         string `json:"geometry"`
	AssignedUser     string `json:"assignedUser"`
}

type ExportService struct {
	*util.Logger
	projectService *project.ProjectService
}

func Init(logger *util.Logger, projectService *project.ProjectService) *ExportService {
	return &ExportService{
		Logger:         logger,
		projectService: projectService,
	}
}

func (s *ExportService) ExportProject(projectId string, potentialMemberId string) (*ProjectExport, error) {
	project, err := s.projectService.GetProject(projectId, potentialMemberId)
	if err != nil {
		return nil, err
	}

	return toProjectExport(project), nil
}

func (s *ExportService) ImportProject(projectExport *ProjectExport) (*project.Project, error) {
	projectDraftDto := &project.ProjectDraftDto{
		Name:        projectExport.Name,
		Description: projectExport.Description,
		Users:       projectExport.Users,
		Owner:       projectExport.Owner,
	}

	taskDraftDtos := make([]task.TaskDraftDto, len(projectExport.Tasks))
	for i := 0; i < len(projectExport.Tasks); i++ {
		t := projectExport.Tasks[i]
		taskDraftDtos[i] = task.TaskDraftDto{
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