import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from '../user/current-user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private currentUserService: CurrentUserService
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // if already logged in, then get the user name and store it locally in the user service
    if (this.authService.isAuthenticated()) {
      // already logged in
      try {
        this.authService.setUserNameFromToken();
      } catch {
        this.currentUserService.resetUser();
        localStorage.removeItem('auth_token');
      }
    } else {
      // not logged in
      this.currentUserService.resetUser();
      localStorage.removeItem('auth_token');
    }

    // The login component has the route '/' and therefore the path is ''
    const requestLoginComponent = route.routeConfig?.path === '';

    if (requestLoginComponent && this.authService.isAuthenticated()) {
      // Token exists and login component should be loaded -> redirect to dashboard
      this.router.navigateByUrl('/dashboard');
      return false;
    } else if (!requestLoginComponent && !this.authService.isAuthenticated()) {
      // No token -> not logged in -> redirect to login page
      this.router.navigateByUrl('/');
      return false;
    }

    // We have a token and want to load a normal component -> ok
    // We don't have a token but want to load the login page -> ok
    return true;
  }
}
