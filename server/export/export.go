package export

import (
	"github.com/hauke96/simple-task-manager/server/project"
	"github.com/hauke96/simple-task-manager/server/task"
	"github.com/hauke96/simple-task-manager/server/util"
	"time"
)

type ProjectExport struct {
	Name         string
	Users        []string
	Owner        string
	Description  string
	CreationDate *time.Time
	Tasks        []*TaskExport
}

type TaskExport struct {
	Name             string
	ProcessPoints    int
	MaxProcessPoints int
	Geometry         string
	AssignedUser     string
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
