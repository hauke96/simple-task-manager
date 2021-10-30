import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../user/current-user.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../common/services/notification.service';
import { LoadingService } from '../common/services/loading.service';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private currentUserService: CurrentUserService
  ) {
  }

  ngOnInit(): void {
  }

  public get userName(): string | undefined {
    return this.currentUserService.getUserName();
  }

  public onLogoutClicked(): void {
    this.authService.logout();
  }
}
