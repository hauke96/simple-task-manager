import { NgZone, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  constructor(private router: Router, private ngZone: NgZone, private authService: AuthService, private userService: UserService) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/manager']);
    }
  }

  public onLoginButtonClick(): void {
    // We need the "ngZone.run" because otherwise the navigation would take place
    // outside the angular context which then causes an error. Using "ngZone.run"
    // executes the passed function within the context which then works perfectly.
    this.authService.requestLogin(() => this.ngZone.run(() => this.router.navigate(['/manager'])));
  }
}
