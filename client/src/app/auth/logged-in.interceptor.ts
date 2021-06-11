import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NotificationService } from '../common/notification.service';
import { environment } from '../../environments/environment';

@Injectable()
export class LoggedInInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private notificationService: NotificationService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // JOSM-Remote-Control or OSM-API
    if (!request.url.startsWith(environment.base_url)) {
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
