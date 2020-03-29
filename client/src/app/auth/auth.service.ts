import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private localStorageTimer;

  constructor(private userService: UserService) {
    // if already logged in, then get the user name and store it locally in the user service
    if (this.isAuthenticated()) {
      // TODO Server call for user information
      this.userService.setUser('user123');
    }
  }

  public isAuthenticated(): boolean {
    // TODO ask server if Token is valid
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

  private waitForLocalStorageToken(callback: () => void) {
    const token = localStorage.getItem('auth_token');
    if (!!token && !!this.localStorageTimer) {
      console.log('Token found, login finished');
      // TODO Ask server for user name. Only if that works (and the token is therefore valid), proceed. Otherwise show error message and abort timer.
      const userName = 'user123';
      this.userService.setUser(userName);

      clearInterval(this.localStorageTimer);

      callback();
    }
  }

  // Removes all login information from the local storage and also from the user service.
  public logout() {
    this.userService.resetUser();
    localStorage.clear();
  }
}
