package websocket

import (
	"github.com/gorilla/websocket"
	"github.com/hauke96/simple-task-manager/server/util"
	"net/http"
)

const (
	MessageType_ProjectAdded       = "project_added"
	MessageType_ProjectUpdated     = "project_updated"
	MessageType_ProjectDeleted     = "project_deleted"
	MessageType_ProjectUserRemoved = "project_user_removed"
)

type Message struct {
	// One of the "MessageType" strings
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		// Yes, the documentation says that this could lead to a CSRF vulnerability. Since the STM Clients doesn't use
		// cookies but values from the local storage, this is not a problem. Also: The websocket connection is only used
		// to SEND things and not to RECEIVE things.
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	// One user should be able to have multiple open websocket connections
	connections = make(map[string][]*websocket.Conn, 0)
)

type WebsocketSender struct {
	util.Logger
}

func Init(logTraceId int) *WebsocketSender {
	return &WebsocketSender{
		Logger: util.Logger{LogTraceId: logTraceId},
	}
}

func (s *WebsocketSender) GetWebsocketConnection(w http.ResponseWriter, r *http.Request, uid string) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		//sigolo.Error("Could not upgrade response writer and request to websocket connection")
		s.Stack(err)
		util.ResponseInternalError(w, err)
		return
	}

	if connections[uid] == nil {
		connections[uid] = make([]*websocket.Conn, 0)
	}

	connections[uid] = append(connections[uid], ws)
}

func (s *WebsocketSender) Send(message Message, uids ...string) {
	s.SendAll([]Message{message}, uids...)
}

func (s *WebsocketSender) SendAll(messages []Message, uids ...string) {
	for _, uid := range uids {
		userConnections := connections[uid]

		for _, c := range userConnections {
			// Send data as JSON
			err := c.WriteJSON(messages)

			if err != nil {
				//sigolo.Error("Unable to send to websocket, close it. Error: %s", err.Error())
				s.Stack(err)

				err := c.Close()
				if err != nil {
					//sigolo.Error("Wasn't even able to close it: %s", err.Error())
					s.Stack(err)
				}
			}
		}
	}
}
