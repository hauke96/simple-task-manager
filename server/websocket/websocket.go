package websocket

import (
	"github.com/gorilla/websocket"
	"github.com/hauke96/sigolo"
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

func GetWebsocketConnection(w http.ResponseWriter, r *http.Request, uid string) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		//sigolo.Error("Could not upgrade response writer and request to websocket connection")
		sigolo.Stack(err)
		util.ResponseInternalError(w, err)
		return
	}

	if connections[uid] == nil {
		connections[uid] = make([]*websocket.Conn, 0)
	}

	connections[uid] = append(connections[uid], ws)
}

func Send(message Message, uids ...string) {
	SendAll([]Message{message}, uids...)
}

func SendAll(messages []Message, uids ...string) {
	for _, uid := range uids {
		userConnections := connections[uid]

		for i := 0; i < len(userConnections); i++ {
			conn := userConnections[i]

			// Send data as JSON
			err := conn.WriteJSON(messages)

			if err != nil {
				// Use Debug logging because this will happen a lot (e.g. every time someone reloads the web client)
				sigolo.Debug("ERROR: Unable to send to websocket")
				sigolo.Debug("ERROR: " + err.Error())

				err := conn.Close()
				if err != nil {
					sigolo.Debug("ERROR: Wasn't even able to close it")
					sigolo.Debug("ERROR: " + err.Error())
				}

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
