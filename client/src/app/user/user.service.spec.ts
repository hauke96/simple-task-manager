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

    service.setUser('test-user');

    expect(service.getUserName()).toEqual('test-user');
  });

  it('should reset correctly', () => {
    expect(service).toBeTruthy();
    service.setUser('test-user');

    service.resetUser();

    expect(service.getUserName()).toEqual(undefined);
  });
});
