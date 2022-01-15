import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NotificationService } from '../common/services/notification.service';
import { environment } from '../../environments/environment';

@Injectable()
export class LoggedInInterceptor implements HttpInterceptor {
  private readonly unauthenticatedEndpoints = [
    environment.url_config
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Do not intercept unauthenticated URLs, for example: JOSM-Remote-Control or OSM-API
    const url = request.url;
    if (!url.startsWith(environment.base_url) || this.unauthenticatedEndpoints.some(endpoint => url.startsWith(endpoint))) {
      return next.handle(request);
    }

    const token = localStorage.getItem('auth_token');
    request = request.clone({
      setHeaders: {
        Authorization: token
      }
    } as unknown as HttpRequest<unknown>);

    return next.handle(request)
      .pipe(catchError((e: HttpErrorResponse) => {
        console.error(e);
        if (e.status === 401) {
          console.error('Trigger logout: ' + (e as HttpErrorResponse).message);
          this.notificationService.addWarning($localize`:@@WARN_AUTH_FAIL:Logout because authorization was not successful`);
          this.authService.logout();
        }
        throw e;
      }));
  }
}
