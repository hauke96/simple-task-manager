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
		TaskIDs: []string{"t-0", "t-1"},
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Foo",
		TaskIDs: []string{"t-2"},
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Bar",
		TaskIDs: []string{"t-3", "t-4"},
	})
}

func GetProjects() []Project {
	return projects
}

func AddProject(name string, taskIds []string) Project {
	p := Project{
		Id:      GetId(),
		Name:    name,
		TaskIDs: taskIds,
	}

	projects = append(projects, p)

	return p
}
