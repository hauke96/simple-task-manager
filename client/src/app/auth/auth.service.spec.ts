import { AuthService } from './auth.service';
import { CurrentUserService } from '../user/current-user.service';
import { NotificationService } from '../common/services/notification.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let currentUserService: CurrentUserService;
  let router: Router;
  let notificationService: NotificationService;

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    router = {} as Router;
    notificationService = {} as NotificationService;

    service = new AuthService(currentUserService, router, notificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should determine authenticated state correctly', () => {
    localStorage.removeItem('auth_token');
    expect(service.isAuthenticated()).toEqual(false);

    localStorage.setItem('auth_token', 'dummy-token');
    expect(service.isAuthenticated()).toEqual(true);
  });

  it('should interpret empty string as not authenticated', () => {
    localStorage.setItem('auth_token', '');
    expect(service.isAuthenticated()).toEqual(false);
  });

  it('should interpret null as not authenticated', () => {
    // @ts-ignore
    localStorage.setItem('auth_token', null);
    expect(service.isAuthenticated()).toEqual(false);
  });

  it('should interpret undefined as not authenticated', () => {
    // @ts-ignore
    localStorage.setItem('auth_token', undefined);
    expect(service.isAuthenticated()).toEqual(false);
  });

  it('constructor should set user name correctly', () => {
    currentUserService.setUser = jest.fn();

    localStorage.setItem('auth_token', 'eyJ2YWxpZF91bnRpbCI6MjU4ODM3MTQ0MywidXNlciI6InRlc3QtdXNlciIsInVpZCI6IjEyMzQ1Iiwic2VjcmV0IjoiMHZWdkJZNHNRWDQrTTY5byt4TEhLSm5oYWZIekNkNlFDWWh3L2pzNlR0MD0ifQo=');

    service.setUserNameFromToken();

    expect(currentUserService.setUser).toHaveBeenCalledWith('test-user', '12345');
  });
});
