import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../user/current-user.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private currentUserService: CurrentUserService
  ) {
  }

  public get userName(): string | undefined {
    return this.currentUserService.getUserName();
  }

  public onLogoutClicked(): void {
    this.authService.logout();
  }
}
