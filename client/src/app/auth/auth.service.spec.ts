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
    localStorage.setItem('auth_token', 'eyJ2YWxpZF91bnRpbCI6MjU4ODM3MTQ0MywidXNlciI6InRlc3QtdXNlciIsInNlY3JldCI6IjB2VnZCWTRzUVg0K002OW8reExIS0puaGFmSHpDZDZRQ1lody9qczZUdDA9In0K');

    service.setUserNameFromToken();

    expect(logoutSpy).not.toHaveBeenCalled();
    expect(userService.getUser()).toEqual('test-user'); // Encoded in token
  });

  it('constructor should set user name correctly', () => {
    localStorage.setItem('auth_token', 'not valid token');

    service.setUserNameFromToken();

    expect(logoutSpy).toHaveBeenCalled();
  });
});
