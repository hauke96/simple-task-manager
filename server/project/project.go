package project

type Project struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	TaskIDs []string `json:"taskIds"`
	Users   []string `json:"users"`
	Owner   string   `json:"owner"`
}

type ProjectStore interface {
	init()
	getProjects(user string) []*Project
	getProject(id string) (*Project, error)
	addProject(draft *Project, user string) *Project
	addUser(userToAdd string, id string, owner string) (*Project, error)
}

var (
	store ProjectStore
)

func Init() {
	// TODO Use database store depending on configuration
	store = &ProjectStoreLocal{}
	store.init()
}

func GetProjects(user string) []*Project {
	return store.getProjects(user)
}

func AddProject(project *Project, user string) *Project {
	return store.addProject(project, user)
}

func GetProject(id string) (*Project, error) {
	return store.getProject(id)
}

func AddUser(user, id, potentialOwner string) (*Project, error) {
	return store.addUser(user, id, potentialOwner)
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
