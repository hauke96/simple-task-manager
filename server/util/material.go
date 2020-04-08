package util

// Structs when requesting user information
type Osm struct {
	User OsmUser `xml:"user"`
}

type OsmUser struct {
	DisplayName string `xml:"display_name,attr"`
}
