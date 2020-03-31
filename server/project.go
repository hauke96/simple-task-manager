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
		TaskIDs: []string{"t-6", "t-7", "t-8", "t-9", "t-10"},
	})
}

func GetProjects() []Project {
	return projects
}

func AddProject(project Project) Project {
	project.Id = "p-" + GetId()
	projects = append(projects, project)
	return project
}
