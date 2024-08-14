import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WebsocketMessage } from '../entities/websocket-message';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Subscription } from 'rxjs';
import { CurrentUserService } from '../../user/current-user.service';
import { Unsubscriber } from '../unsubscriber';

@Injectable({
  providedIn: 'root'
})
export class WebsocketClientService extends Unsubscriber {
  private websocket?: WebSocketSubject<WebsocketMessage[]>;
  private websocketSubscription?: Subscription;

  public messageReceived: EventEmitter<WebsocketMessage> = new EventEmitter<WebsocketMessage>();

  constructor(currentUserService: CurrentUserService, ngZone: NgZone) {
    super();

    this.unsubscribeLater(
      currentUserService.onUserChanged.subscribe(() => {
        this.websocket?.complete();
        this.websocket = undefined;
        this.websocketSubscription?.unsubscribe();
        this.websocketSubscription = undefined;
      })
    );

    ngZone.runOutsideAngular(() => this.connect());
  }

  private connect(): void {
    let currentlyConnecting = false;
    let currentlySubscribing = false;

    setInterval(() => {
      if (!currentlyConnecting && (!this.websocket || this.websocket.closed)) {
        currentlyConnecting = true;

        const authToken = localStorage.getItem('auth_token');
        if (authToken && authToken.trim().length > 0) {
          console.log('Try to connect to updates');
          this.websocket = new WebSocketSubject<WebsocketMessage[]>({
            url: environment.url_updates + '?token=' + encodeURIComponent(authToken)
          });
        }

        currentlyConnecting = false;
      }
    },
    1000);

    setInterval(() => {
      const hasWebsocketConnection = this.websocket && !this.websocket.closed;
      const hasWebsocketSubscription = this.websocketSubscription && !this.websocketSubscription.closed;
      if (!currentlySubscribing && hasWebsocketConnection && !hasWebsocketSubscription) {
        console.log('Try to subscribe to updates');
        currentlySubscribing = true;

        this.websocketSubscription = this.websocket?.subscribe({
          next: (messages: WebsocketMessage[]) => {
            for (const msg of messages) {
              this.messageReceived.emit(msg);
            }
          },
          error: err => {
            console.log('WebSocket connection lost');
            console.error(err);
            // Close all connections to reconnect in a second
            this.websocketSubscription?.unsubscribe();
            this.websocket?.complete();
          }
        });

        currentlySubscribing = false;
      }
    },
    1000);
  }
}
