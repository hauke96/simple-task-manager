package config

type Dto struct {
	SourceRepoURL        string `json:"sourceRepoUrl"`        // URL to the source code repository.
	MaxTasksPerProject   int    `json:"maxTasksPerProject"`   // Maximum amount of tasks allowed for a project.
	MaxDescriptionLength int    `json:"maxDescriptionLength"` // Maximum length for the project description in characters. Default: 1000.
	TestEnvironment      bool   `json:"testEnvironment"`      // True when the server runs in an test environment
	OsmApiUrl            string `json:"osmApiUrl"`            // The base-URL to the OSM server.
}

func GetConfigDto() *Dto {
	return &Dto{
		SourceRepoURL:        Conf.SourceRepoURL,
		MaxTasksPerProject:   Conf.MaxTasksPerProject,
		MaxDescriptionLength: Conf.MaxDescriptionLength,
		TestEnvironment:      Conf.TestEnvironment,
		OsmApiUrl:            Conf.OsmApiUrl,
	}
}
