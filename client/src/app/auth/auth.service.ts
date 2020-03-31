import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private localStorageTimer;

  constructor(private userService: UserService, private router: Router) {
    // if already logged in, then get the user name and store it locally in the user service
    if (this.isAuthenticated()) {
      this.setUserNameFromToken();
    }
    // TODO else: Logout? Request Login? Just an error message?
  }

  private setUserNameFromToken() {
    try {
      const encodedToken = localStorage.getItem('auth_token');
      const decodedToken = atob(encodedToken);
      const token = JSON.parse(decodedToken);
      this.userService.setUser(token.user);
    }
    catch(e) {
      console.error(e);
      this.logout();
    }
  }

  public isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // performs the authentication process, sets the user name in the UserService
  // and then calls the "callback" function.
  public requestLogin(callback: () => void) {
    const w = 600, h = 550;
    const settings = [
      ['width', w], ['height', h],
      ['left', screen.width / 2 - w / 2],
      ['top', screen.height / 2 - h / 2]].map(function(x) {
      return x.join('=');
    }).join(',');
    const popup = window.open('http://localhost:8080/oauth_login?+?qt='+new Date().getTime()+'&redirect=http://localhost:4200/oauth-landing', 'oauth_window', settings);

    this.localStorageTimer = setInterval(this.waitForLocalStorageToken.bind(this), 250, callback.bind(this));
  }

  // Checks wether the local storate contains a token. If so, the user will be
  // set and the callback function called.
  private waitForLocalStorageToken(callback: () => void) {
    // Is authenticated and the timer exists (otherwise we'll get an error when
    // we try to reset it)
    if (this.isAuthenticated() && !!this.localStorageTimer) {
      this.setUserNameFromToken();

      clearInterval(this.localStorageTimer);

      callback();
    }
  }

  // Removes all login information from the local storage and also from the user service.
  public logout() {
    this.userService.resetUser();
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
