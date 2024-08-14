import { WebsocketClientService } from './websocket-client.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Observable, of } from 'rxjs';
import { User } from '../../user/user.material';
import { NgZone } from '@angular/core';

describe(WebsocketClientService.name, () => {
  let service: WebsocketClientService;
  let currentUserService: CurrentUserService;
  let ngZone: NgZone;

  beforeEach(() => {
    currentUserService = {
      onUserChanged: new Observable<User | undefined>(),
    } as CurrentUserService;
    ngZone = {} as NgZone;
    ngZone.runOutsideAngular = jest.fn();
    service = new WebsocketClientService(currentUserService, ngZone);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
