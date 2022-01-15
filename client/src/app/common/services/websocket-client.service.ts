import { EventEmitter, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WebsocketMessage } from '../entities/websocket-message';
import { WebSocketSubject } from 'rxjs/webSocket';
import { delay, retryWhen, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketClientService {
  public messageReceived: EventEmitter<WebsocketMessage> = new EventEmitter<WebsocketMessage>();

  constructor() {
    this.connect();
  }

  connect() {
    const authToken = localStorage.getItem('auth_token');
    if (authToken == null || authToken.trim().length === 0) {
      return;
    }

    const ws = new WebSocketSubject<WebsocketMessage[]>({
      url: environment.url_updates + '?token=' + encodeURIComponent(authToken)
    });

    ws
      .pipe(
        retryWhen(err => { // In case of a connection loss, reconnect using the "retryWhen" pipe
          return err.pipe(
            tap(e => {
              console.error('WebSocket connection lost');
              console.error(e);
            }),
            delay(1000)
          );
        })
      )
      .subscribe((messages: WebsocketMessage[]) => {
        for (const msg of messages) {
          this.messageReceived.emit(msg);
        }
      }, err => console.error(err));
  }
}
