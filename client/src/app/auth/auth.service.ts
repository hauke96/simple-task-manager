import { Injectable } from '@angular/core';
import * as osmAuth from 'osm-auth';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: any;

  constructor(private userService: UserService) {
    this.auth = new osmAuth({
      url: environment.osm_auth_url,
      landing: environment.oauth_landing,
      oauth_consumer_key: environment.oauth_consumer_key,
      oauth_secret: environment.oauth_secret,
      auto: true // show a login form if the user is not authenticated and
                 // you try to do a call
    });

    // if already logged in, then get the user name and store it locally in the user service
    if (this.isAuthenticated()) {
      this.getUserData((details, err) => {
        console.error(err);
        const userName = details.getElementsByTagName('user')[0].getAttribute('display_name');
        this.userService.setUser(userName);
      });
    }
  }

  public isAuthenticated(): boolean {
    return this.auth.authenticated();
  }

  // performs the authentication process, sets the user name in the UserService
  // and then calls the "callback" function.
  public requestLogin(callback: () => void) {
    this.auth.authenticate(() => {
      this.getUserData((details, err) => {
        console.error(err);
        const userName = details.getElementsByTagName('user')[0].getAttribute('display_name');
        this.userService.setUser(userName);
        callback();
      });
    });
  }

  // Removes all login information from the local storage and also from the user service.
  public logout() {
    this.userService.resetUser();
    this.auth.logout();
  }

  // Requests user information for the current logged in user on the osm-server.
  private getUserData(callback: (details, err) => void) {
    this.auth.xhr({
      method: 'GET',
      path: '/api/0.6/user/details'
    }, (err, details) => {
      callback(details, err);
    });
  }
}
