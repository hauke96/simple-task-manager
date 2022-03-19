import { LoggedInInterceptor } from './logged-in.interceptor';
import { AuthService } from './auth.service';
import { NotificationService } from '../common/services/notification.service';
import { HttpRequest } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

describe(LoggedInInterceptor.name, () => {
  let interceptor: LoggedInInterceptor;
  let authService: AuthService;
  let notificationService: NotificationService;
  let translationService: TranslateService;

  beforeEach(() => {
    authService = {} as AuthService;
    notificationService = {} as NotificationService;
    translationService = {} as TranslateService;

    interceptor = new LoggedInInterceptor(authService, notificationService, translationService);
  });

  it('should call next handler on unauthenticated URLs', () => {
    const nextHandler = {
      handle: jest.fn()
    };

    const request = {url: 'https://foo.com/bar'} as HttpRequest<any>;

    interceptor.intercept(request, nextHandler);

    expect(nextHandler.handle).toHaveBeenCalledWith(request);
  });

  it('should add authentication token to request', () => {
    const authToken = 'FOO_BAR';
    localStorage.setItem('auth_token', authToken);

    const nextHandler = {
      handle: jest.fn().mockReturnValue(of())
    };

    const request = {url: environment.base_url + '/foo/bar'} as HttpRequest<any>;
    request.clone = jest.fn().mockReturnValue(request);

    interceptor.intercept(request, nextHandler);

    expect(request.clone).toHaveBeenCalled();
    expect(nextHandler.handle).toHaveBeenCalled();
  });
});
