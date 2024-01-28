import { WebsocketClientService } from './websocket-client.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Observable, of } from 'rxjs';
import { User } from '../../user/user.material';

describe(WebsocketClientService.name, () => {
  let service: WebsocketClientService;
  let currentUserService: CurrentUserService;

  beforeEach(() => {
    currentUserService = {
      onUserChanged: new Observable<User | undefined>(),
    } as CurrentUserService;
    service = new WebsocketClientService(currentUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
