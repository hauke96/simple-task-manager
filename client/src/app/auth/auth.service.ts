import { Injectable } from '@angular/core';
import * as osmAuth from 'osm-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: any;

  constructor() {
	this.auth = new osmAuth({
	  url: 'https://master.apis.dev.openstreetmap.org',
	  landing: '/oauth-landing',
	  oauth_consumer_key: 'TWaSD2RpZbtxuV5reVZ7jOQNDGmPjDux2BGK3zUy',
	  oauth_secret: 'a8K9wAU4Z8v8G7ayxnOpjnsLknkW72Txh62Nsu1C',
	  auto: true // show a login form if the user is not authenticated and
	             // you try to do a call
	});
  }

  public isAuthenticated() : boolean {
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
    }, function(err, details) {
	  callback(details, err);
    });
  }
}
