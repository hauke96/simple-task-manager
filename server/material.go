package main

type Task struct {
	Id               string      `json:"id"`
	ProcessPoints    int         `json:"processPoints"`
	MaxProcessPoints int         `json:"maxProcessPoints"`
	Geometry         [][]float64 `json:"geometry"`
	AssignesUser     string      `json:"assignedUser"`
}

// Structs when requesting user information
type Osm struct {
	User User `xml:"user"`
}

type User struct {
	DisplayName string `xml:"display_name,attr"`
}

// Struct for authentication
type Token struct {
	ValidUntil int64  `json:"valid_until"`
	User       string `json:"user"`
	Secret     string `json:"secret"`
}
