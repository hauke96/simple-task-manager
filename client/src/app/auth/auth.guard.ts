import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {
  }

  canActivate() {
    // TODO ask server if Token is valid
    console.log('Check canActivate()');
    return !!localStorage.getItem('auth_token');
  }
}
