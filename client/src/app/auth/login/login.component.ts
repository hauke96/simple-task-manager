import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { WebsocketClientService } from '../../common/websocket-client.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  constructor(
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private websocketClientService: WebsocketClientService
  ) {
  }

  ngOnInit(): void {
  }

  public onLoginButtonClick(): void {
    // We need the "ngZone.run" because otherwise the navigation would take place
    // outside the angular context which then causes an error. Using "ngZone.run"
    // executes the passed function within the context which then works perfectly.
    this.authService.requestLogin(() => this.ngZone.run(() => {
      this.websocketClientService.connect();
      this.router.navigate(['/manager']);
    }));
  }
}
