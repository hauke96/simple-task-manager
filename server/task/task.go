package task

type Task struct {
	Id               string      `json:"id"`
	ProcessPoints    int         `json:"processPoints"`
	MaxProcessPoints int         `json:"maxProcessPoints"`
	Geometry         [][]float64 `json:"geometry"`
	AssignedUser     string      `json:"assignedUser"`
}

type TaskStore interface {
	init()
	getTasks(taskIds []string) []*Task
	getTask(id string) (*Task, error)
	addTasks(newTasks []*Task) []*Task
	assignUser(id, user string) (*Task, error)
	unassignUser(id, user string) (*Task, error)
	setProcessPoints(id string, newPoints int) (*Task, error)
}

var (
	store TaskStore
)

func Init() {
	store = &TaskStoreLocal{}
	store.init()
}

func GetTasks(taskIds []string) []*Task {
	return store.getTasks(taskIds)
}

func GetTask(id string) (*Task, error) {
	return store.getTask(id)
}

// AddTasks sets the ID of the tasks and adds them to the storage.
func AddTasks(newTasks []*Task) []*Task {
	return store.addTasks(newTasks)
}

func AssignUser(id, user string) (*Task, error) {
	return store.assignUser(id, user)
}

func UnassignUser(id, user string) (*Task, error) {
	return store.unassignUser(id, user)
}

func SetProcessPoints(id string, newPoints int) (*Task, error) {
	return store.setProcessPoints(id, newPoints)
}
