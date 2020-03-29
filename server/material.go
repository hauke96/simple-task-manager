package main

type Project struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	TaskIDs []string `json:"taskIds"`
}

type Osm struct {
	User User `xml:"user"`
}

type User struct {
	DisplayName string `xml:"display_name,attr"`
}
