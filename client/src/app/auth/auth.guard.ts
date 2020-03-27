import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    const isAuthenticated = this.authService.isAuthenticated();

	if(!isAuthenticated) {
	  this.router.navigate(['/']);
	}

	return isAuthenticated;
  }
}
