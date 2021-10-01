import { TestBed } from '@angular/core/testing';

import { WebsocketClientService } from './websocket-client.service';

describe('WebsocketClientService', () => {
  let service: WebsocketClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebsocketClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
