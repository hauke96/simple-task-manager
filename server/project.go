package main

type Project struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	TaskIDs []string `json:"taskIds"`
	Users   []string `json:"users"`
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
		Users:   []string{"hauke-stieler"},
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Foo",
		TaskIDs: []string{"t-5"},
		Users:   []string{"hauke-stieler", "hauke-stieler-tzu"},
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Bar",
		TaskIDs: []string{"t-6", "t-7", "t-8", "t-9", "t-10"},
		Users:   []string{"hauke-stieler-tzu"},
	})
}

func GetProjects(user string) []Project {
	result := make([]Project, 0)

	for _, p := range projects {
		for _, u := range p.Users {
			if u == user {
				result = append(result, p)
			}
		}
	}

	return result
}

func AddProject(project Project) Project {
	project.Id = "p-" + GetId()
	projects = append(projects, project)
	return project
}
