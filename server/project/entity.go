package project

import (
	"github.com/hauke96/simple-task-manager/server/task"
	"time"
)

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
