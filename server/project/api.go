package project

import "stm/task"

type ProjectAddDto struct {
	Project ProjectDraftDto     `json:"project"`
	Tasks   []task.TaskDraftDto `json:"tasks"`
}

type ProjectDraftDto struct {
	Name           string         `json:"name"`           // Name of the project. Must not be NULL or empty.
	Description    string         `json:"description"`    // Description of the project. Must not be NULL but cam be empty.
	Users          []string       `json:"users"`          // A non-empty list of user-IDs. At least the owner should be in here.
	Owner          string         `json:"owner"`          // The user-ID who created this project. Must not be NULL or empty.
	JosmDataSource JosmDataSource `json:"josmDataSource"` // The source JOSM should load the data from when opening a task in JOSM.
}

type ProjectUpdateDto struct {
	Name           string         `json:"name"`           // Name of the project. Must not be NULL or empty.
	Description    string         `json:"description"`    // Description of the project. Must not be NULL but cam be empty.
	JosmDataSource JosmDataSource `json:"josmDataSource"` // The source JOSM should load the data from when opening a task in JOSM.
}
