import { Injectable } from '@angular/core';
import * as osmAuth from 'osm-auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: any;

  constructor() {
    this.auth = new osmAuth({
      url: environment.osm_auth_url,
      landing: environment.oauth_landing,
      oauth_consumer_key: environment.oauth_consumer_key,
      oauth_secret: environment.oauth_secret,
      auto: true // show a login form if the user is not authenticated and
                 // you try to do a call
    });
  }

  public isAuthenticated(): boolean {
    return this.auth.authenticated();
  }

  public requestLogin(callback: () => void) {
    this.auth.authenticate(callback);
  }

  public logout() {
    this.auth.logout();
  }

  public getUserData(callback: (details, err) => void) {
    this.auth.xhr({
      method: 'GET',
      path: '/api/0.6/user/details'
    }, (err, details) => {
      callback(details, err);
    });
  }
}
