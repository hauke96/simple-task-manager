import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class LoggedInInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
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
          this.authService.logout();
        }
        throw e;
      }));
  }
}
