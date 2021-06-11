import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { CurrentUserService } from '../user/current-user.service';
import { RouterTestingModule } from '@angular/router/testing';
import Spy = jasmine.Spy;

describe('AuthService', () => {
  let currentUserService: CurrentUserService;
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUserService
      ],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    });
    currentUserService = TestBed.inject(CurrentUserService);

    service = TestBed.inject(AuthService);
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
    // @ts-ignore
    localStorage.setItem('auth_token', null);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should interpret undefined as not authenticated', () => {
    // @ts-ignore
    localStorage.setItem('auth_token', undefined);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('constructor should set user name correctly', () => {
    localStorage.setItem('auth_token', 'eyJ2YWxpZF91bnRpbCI6MjU4ODM3MTQ0MywidXNlciI6InRlc3QtdXNlciIsInVpZCI6IjEyMzQ1Iiwic2VjcmV0IjoiMHZWdkJZNHNRWDQrTTY5byt4TEhLSm5oYWZIekNkNlFDWWh3L2pzNlR0MD0ifQo=');

    service.setUserNameFromToken();

    expect(currentUserService.getUserName()).toEqual('test-user'); // Encoded in token
    expect(currentUserService.getUserId()).toEqual('12345'); // Encoded in token
  });
});
