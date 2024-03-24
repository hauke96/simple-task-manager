package comment

import "time"

type Comment struct {
	Id           string     `json:"id"`           // The ID of the task.
	Text         string     `json:"text"`         // The name of the task. If the properties of the geometry feature contain the field "name", this field is used here. If no name has been set, this field will be empty.
	AuthorId     string     `json:"authorId"`     // The user-ID of the user who is currently assigned to this task. Will never be NULL but might be empty.
	CreationDate *time.Time `json:"creationDate"` // The time this comment was created at.
}
