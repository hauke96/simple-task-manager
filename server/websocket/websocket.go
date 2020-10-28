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
	*util.Logger
}

func Init(logger *util.Logger) *WebsocketSender {
	return &WebsocketSender{
		Logger: logger,
	}
}

func (s *WebsocketSender) GetWebsocketConnection(w http.ResponseWriter, r *http.Request, uid string) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		//sigolo.Error("Could not upgrade response writer and request to websocket connection")
		s.Stack(err)
		util.ResponseInternalError(w, s.Logger, err)
		return
	}

	if connections[uid] == nil {
		connections[uid] = make([]*websocket.Conn, 0)
	}

	s.Logger.Log("Created websocket connection for user '%s'", uid)
	connections[uid] = append(connections[uid], ws)
}

func (s *WebsocketSender) Send(message Message, uids ...string) {
	s.SendAll([]Message{message}, uids...)
}

func (s *WebsocketSender) SendAll(messages []Message, uids ...string) {
	for _, uid := range uids {
		userConnections := connections[uid]

		for i := 0; i < len(userConnections); i++ {
			conn := userConnections[i]

			// Send data as JSON
			err := conn.WriteJSON(messages)

			if err != nil {
				// Use Debug logging because this will happen a lot (e.g. every time someone reloads the web client)
				s.Debug("ERROR: Unable to send to websocket")
				s.Debug("ERROR: " + err.Error())

				//sigolo.Error("Unable to send to websocket, close it. Error: %s", err.Error())
				s.Stack(err)

				err := conn.Close()
				if err != nil {
					s.Debug("ERROR: Wasn't even able to close it")
					s.Debug("ERROR: " + err.Error())
					//sigolo.Error("Wasn't even able to close it: %s", err.Error())
					s.Stack(err)

					// Remove the closed connection from the list of connections:
					userConnections[i] = userConnections[len(userConnections)-1] // overwrite i-th element by the last element
					userConnections[len(userConnections)-1] = nil                // delete the now duplicate last element from slice
					userConnections = userConnections[:len(userConnections)-1]   // reduce slice size by 1
					i--                                                          // fix index so that we don't skip the i-th connection we just copied
				}
			}

			// Update connection list in case some connections have been removed
			connections[uid] = userConnections
		}
	}
}
