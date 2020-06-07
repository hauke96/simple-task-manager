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
    console.log('Create websocket connection to ' + environment.url_updates);

    const ws = new WebSocketSubject<WebsocketMessage[]>({
      url: environment.url_updates,
      protocol: [localStorage.getItem('auth_token')]
    });

    ws.subscribe((messages: WebsocketMessage[]) => {
      console.log('Received raw data');
      console.log(messages);
      for (const msg of messages) {
        this.messageReceived.emit(msg);
      }
    }, err => console.error(err));

    // const ws: WebSocket = new WebSocket(environment.url_updates);
    // ws.onmessage = (m: MessageEvent) => {
    //   console.log(m);
    // };
  }
}
