import { NgZone, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  constructor(private router: Router, private ngZone: NgZone, private authService: AuthService) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/manager']);
    }
  }

  public onLoginButtonClick(): void {
    this.authService.requestLogin(() => this.ngZone.run(() => this.router.navigate(['/manager'])));
  }
}
