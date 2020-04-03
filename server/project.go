package main

type Project struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	TaskIDs []string `json:"taskIds"`
	Users   []string `json:"users"`
	Owner   string   `json:"owner"`
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
		Owner:   "hauke-stieler",
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Foo",
		TaskIDs: []string{"t-5"},
		Users:   []string{"hauke-stieler", "hauke-stieler-dev"},
		Owner:   "hauke-stieler",
	})
	projects = append(projects, Project{
		Id:      "p-" + GetId(),
		Name:    "Bar",
		TaskIDs: []string{"t-6", "t-7", "t-8", "t-9", "t-10"},
		Users:   []string{"hauke-stieler-dev"},
		Owner:   "hauke-stieler-dev",
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

func AddProject(project Project, user string) Project {
	project.Id = "p-" + GetId()
	project.Users = []string{user}
	project.Owner = user
	projects = append(projects, project)
	return project
}

// VerifyOwnership checks wether all given tasks are part of projects where the
// given user is a member of. In otherwords: This function checks if the user
// has the permission to change each task.
func VerifyOwnership(user string, taskIds []string) bool {
	// Only look at projects the user is part of. We then need less checks below
	userProjects := GetProjects(user)

	for _, taskId := range taskIds {
		found := false

		for _, project := range userProjects {
			for _, t := range project.TaskIDs {
				found = t == taskId

				if found {
					break
				}
			}

			if found {
				break
			}
		}

		// We went through all projects the given user is member of and we didn't
		// find a match. The user is therefore not allowed to view the current
		// task and we can abort here.
		if !found {
			return false
		}
	}

	return true
}
