import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {
  public userName: string;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.getUserData((details, err) => {
      console.error(err);
      this.userName = details.getElementsByTagName('user')[0].getAttribute('display_name');
    });
  }

  public onLogoutClicked() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
