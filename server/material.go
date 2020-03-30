package main

// Structs when requesting user information
type Osm struct {
	User User `xml:"user"`
}

type User struct {
	DisplayName string `xml:"display_name,attr"`
}
