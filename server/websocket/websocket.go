package websocket

import (
	"github.com/gorilla/websocket"
	"github.com/hauke96/sigolo"
	"github.com/hauke96/simple-task-manager/server/util"
	"net/http"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		// Yes, the documentation says that this could lead to a CSRF vulnerability. Since the STM Clients doesn't use
		// cookies but values from the local storage, this is not a problem. Also: The websocket connection is only used
		// to SEND things and not to RECEIVE things.
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	connections = make([]*websocket.Conn, 0)
)

func GetWebsocketConnection(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		sigolo.Error("Could not upgrade response writer and request to websocket connection")
		util.ResponseInternalError(w, err.Error())
		return
	}

	connections = append(connections, ws)
}
