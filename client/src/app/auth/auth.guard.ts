import { Injectable, Type } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { LoginComponent } from './login/login.component';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if ((route.component as Type<any>).name === 'LoginComponent' && !!localStorage.getItem('auth_token')) {
      // Token exists and login component should be loaded -> redirect to manager
      this.router.navigateByUrl('/manager');
      return false;
    } else if ((route.component as Type<any>).name !== 'LoginComponent' && !localStorage.getItem('auth_token')) {
      // No token -> not logged in -> redirect to login page
      this.router.navigateByUrl('/');
      return false;
    }

    // We have a token and want to load a normal component -> ok
    // We don't have a token but want to load the login page -> ok
    return true;
  }
}
