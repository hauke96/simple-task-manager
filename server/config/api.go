package config

type ConfigDto struct {
	SourceRepoURL        string `json:"source-repo-url"`        // URL to the source code repository.
	MaxTasksPerProject   int    `json:"max-task-per-project"`   // Maximum amount of tasks allowed for a project.
	MaxDescriptionLength int    `json:"max-description-length"` // Maximum length for the project description in characters. Default: 1000.
}

func GetConfigDto() *ConfigDto {
	return &ConfigDto{
		SourceRepoURL:        Conf.SourceRepoURL,
		MaxTasksPerProject:   Conf.MaxTasksPerProject,
		MaxDescriptionLength: Conf.MaxDescriptionLength,
	}
}
