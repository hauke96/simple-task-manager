package export

import "time"

type ProjectExport struct {
	Name         string        `json:"name"`
	Users        []string      `json:"users"`
	Owner        string        `json:"owner"`
	Description  string        `json:"description"`
	CreationDate *time.Time    `json:"creationDate"`
	Tasks        []*TaskExport `json:"tasks"`
}

type TaskExport struct {
	Name             string `json:"name"`
	ProcessPoints    int    `json:"processPoints"`
	MaxProcessPoints int    `json:"maxProcessPoints"`
	Geometry         string `json:"geometry"`
	AssignedUser     string `json:"assignedUser"`
}
