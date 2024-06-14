package oauth2

// Osm is a struct used when requesting user information
type Osm struct {
	User OsmUser `xml:"user"`
}

type OsmUser struct {
	DisplayName string `xml:"display_name,attr"`
	UserId      string `xml:"id,attr"`
}
