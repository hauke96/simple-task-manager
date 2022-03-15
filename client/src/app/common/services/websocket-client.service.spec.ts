import { WebsocketClientService } from './websocket-client.service';

describe(WebsocketClientService.name, () => {
  let service: WebsocketClientService;

  beforeEach(() => {
    service = new WebsocketClientService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
