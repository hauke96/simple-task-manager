import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RouterTestingModule } from '@angular/router/testing';
import Spy = jasmine.Spy;

describe('AuthService', () => {
  let userService: UserService;
  let service: AuthService;
  let logoutSpy: Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService
      ],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    });
    userService = TestBed.inject(UserService);

    service = TestBed.inject(AuthService);

    logoutSpy = spyOn(service, 'logout');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should determine authenticated state correctly', () => {
    localStorage.removeItem('auth_token');
    expect(service.isAuthenticated()).toBeFalse();

    localStorage.setItem('auth_token', 'dummy-token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should interpret empty string as not authenticated', () => {
    localStorage.setItem('auth_token', '');
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should interpret null as not authenticated', () => {
    localStorage.setItem('auth_token', null);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should interpret undefined as not authenticated', () => {
    localStorage.setItem('auth_token', undefined);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('constructor should set user name correctly', () => {
    localStorage.setItem('auth_token', 'eyJ2YWxpZF91bnRpbCI6MjU4ODM3MTQ0MywidXNlciI6InRlc3QtdXNlciIsInVpZCI6IjEyMzQ1Iiwic2VjcmV0IjoiMHZWdkJZNHNRWDQrTTY5byt4TEhLSm5oYWZIekNkNlFDWWh3L2pzNlR0MD0ifQo=');

    service.setUserNameFromToken();

    expect(logoutSpy).not.toHaveBeenCalled();
    expect(userService.getUserName()).toEqual('test-user'); // Encoded in token
    expect(userService.getUserId()).toEqual('12345'); // Encoded in token
  });

  it('constructor should set user name correctly', () => {
    localStorage.setItem('auth_token', 'not valid token');

    service.setUserNameFromToken();

    expect(logoutSpy).toHaveBeenCalled();
  });
});
