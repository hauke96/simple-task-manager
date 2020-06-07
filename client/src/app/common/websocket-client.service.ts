import { EventEmitter, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { WebsocketMessage } from './websocket-message';
import { WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketClientService {
  public messageReceived: EventEmitter<WebsocketMessage> = new EventEmitter<WebsocketMessage>();

  constructor() {
    this.connect();
  }

  connect() {
    const ws = new WebSocketSubject<WebsocketMessage[]>({
      url: environment.url_updates,
      protocol: [localStorage.getItem('auth_token')]
    });

    ws.subscribe((messages: WebsocketMessage[]) => {
      for (const msg of messages) {
        this.messageReceived.emit(msg);
      }
    }, err => console.error(err));
  }
}
