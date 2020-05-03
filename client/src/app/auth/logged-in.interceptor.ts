import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ErrorService } from '../common/error.service';

@Injectable()
export class LoggedInInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private errorService: ErrorService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.startsWith('http://localhost:8111')) {
      return next.handle(request);
    }

    const token = localStorage.getItem('auth_token');
    request = request.clone({
      setHeaders: {
        Authorization: token
      }
    });

    return next.handle(request)
      .pipe(catchError((e: HttpErrorResponse) => {
        console.error(e);
        if (e.status === 401) {
          console.error('Trigger logout: ' + (e as HttpErrorResponse).message);
          this.errorService.addError('Logout because authorization was not successful');
          this.authService.logout();
        }
        throw e;
      }));
  }
}
