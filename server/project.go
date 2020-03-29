package main

type Project struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	TaskIDs []string `json:"taskIds"`
}

var (
	projects []Project
)

func InitProjects() {
	projects = make([]Project, 0)
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "First project",
		TaskIDs: []string{"t-3", "t-4"},
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Foo",
		TaskIDs: []string{"t-5"},
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Bar",
		TaskIDs: []string{"t-6", "t-7"},
	})
}

func GetProjects() []Project {
	return projects
}

func AddProject(name string, taskIds []string) Project {
	p := Project{
		Id:      "p-" + GetId(),
		Name:    name,
		TaskIDs: taskIds,
	}

	projects = append(projects, p)

	return p
}
