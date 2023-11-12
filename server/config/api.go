package config

type ConfigDto struct {
	SourceRepoURL        string `json:"sourceRepoUrl"`        // URL to the source code repository.
	MaxTasksPerProject   int    `json:"maxTasksPerProject"`   // Maximum amount of tasks allowed for a project.
	MaxDescriptionLength int    `json:"maxDescriptionLength"` // Maximum length for the project description in characters. Default: 1000.
	TestEnvironment      bool   `json:"testEnvironment"`      // True when the server runs in an test environment
	OsmBaseUrl           string `json:"osmBaseUrl"`           // The base-URL to the OSM server.
}

func GetConfigDto() *ConfigDto {
	return &ConfigDto{
		SourceRepoURL:        Conf.SourceRepoURL,
		MaxTasksPerProject:   Conf.MaxTasksPerProject,
		MaxDescriptionLength: Conf.MaxDescriptionLength,
		TestEnvironment:      Conf.TestEnvironment,
		OsmBaseUrl:           Conf.OsmBaseUrl,
	}
}
