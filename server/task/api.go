package task

type DraftDto struct {
	MaxProcessPoints int    `json:"maxProcessPoints"` // The maximum amount of process points of this task. Must be larger than zero.
	ProcessPoints    int    `json:"processPoints"`    // The amount of process points that have been set by the user. It applies that "0 <= processPoints <= maxProcessPoints".
	Geometry         string `json:"geometry"`         // A GeoJson feature with a polygon or multi-polygon geometry. If the feature properties contain the field "name", then this will be used as the name of the task.
}
