package task

type Task struct {
	Id               string `json:"id"`               // The ID of the task.
	Name             string `json:"name"`             // The name of the task. If the properties of the geometry feature contain the field "name", this field is used here. If no name has been set, this field will be empty.
	ProcessPoints    int    `json:"processPoints"`    // The amount of process points that have been set by the user. It applies that "0 <= processPoints <= maxProcessPoints".
	MaxProcessPoints int    `json:"maxProcessPoints"` // The maximum amount of process points of this task. Is larger than zero.
	Geometry         string `json:"geometry"`         // A GeoJson feature of the task wit a polygon or multipolygon geometry. Will never be NULL or empty.
	// TODO Use "Id" as suffix?
	AssignedUser string `json:"assignedUser"` // The user-ID of the user who is currently assigned to this task. Will never be NULL but might be empty.
}
