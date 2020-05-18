import { TestBed } from '@angular/core/testing';

import { UserService } from '../user/user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should set and get correctly', () => {
    expect(service).toBeTruthy();

    service.setUser('test-user', '12345');

    expect(service.getUserName()).toEqual('test-user');
    expect(service.getUserId()).toEqual('12345');
  });

  it('should reset correctly', () => {
    expect(service).toBeTruthy();
    service.setUser('test-user', '12345');

    service.resetUser();

    expect(service.getUserName()).toEqual(undefined);
    expect(service.getUserId()).toEqual(undefined);
  });
});
