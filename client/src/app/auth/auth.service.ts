import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CurrentUserService } from '../user/current-user.service';
import { Router } from '@angular/router';
import { NotificationService } from '../common/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private currentUserService: CurrentUserService,
    private router: Router,
    private notificationService: NotificationService
  ) {
  }

  public setUserNameFromToken() {
    const encodedToken = localStorage.getItem('auth_token');
    const decodedToken = atob(encodedToken ?? '');
    const token = JSON.parse(decodedToken);
    this.currentUserService.setUser(token.user, token.uid);
  }

  public isAuthenticated(): boolean {
    const item = localStorage.getItem('auth_token');
    return !!item
      && item.trim() !== 'null'
      && item.trim() !== 'undefined'
      && item.trim().length > 0;
  }

  // performs the authentication process, sets the user name in the UserService
  // and then calls the "callback" function.
  public requestLogin(callback: () => void) {
    const w = 600;
    const h = 550;
    const settings = [
      ['width', w],
      ['height', h],
      ['left', screen.width / 2 - w / 2],
      ['top', screen.height / 2 - h / 2]
    ].map(x => {
      return x.join('=');
    }).join(',');

    const landingUrl = document.location.protocol + '//' + document.location.hostname + ':' + document.location.port + '/oauth-landing';
    window.open(environment.url_auth + '?+?t=' + new Date().getTime() + '&redirect=' + landingUrl, 'oauth_window', settings);

    const localStorageTimer: any = setInterval(() => this.waitForLocalStorageToken(localStorageTimer, callback), 250);
  }

  // Checks wether the local storate contains a token. If so, the user will be
  // set and the callback function called.
  private waitForLocalStorageToken(timer: number, callback: () => void) {
    // Is authenticated and the timer exists (otherwise we'll get an error when
    // we try to reset it)
    if (this.isAuthenticated() && !!timer) {
      try {
        this.setUserNameFromToken();
      } catch (e) {
        console.error(e);
        this.notificationService.addError('Unable to get user name from token');
      }

      clearInterval(timer);

      callback();
    }
  }

  // Removes all login information from the local storage and also from the user service.
  public logout(): void {
    this.currentUserService.resetUser();
    localStorage.removeItem('auth_token');
    this.router.navigate(['/']);
  }
}
