import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { WebsocketClientService } from '../../common/services/websocket-client.service';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public changelogTemplate: string;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private websocketClientService: WebsocketClientService,
    private httpClient: HttpClient,
    private translationService: TranslateService
  ) {
    this.loadChangelogTemplate();

    translationService.onLangChange.subscribe(() => this.loadChangelogTemplate());
  }

  private loadChangelogTemplate(): void {
    const url = 'assets/i18n/changelog.' + this.translationService.currentLang + '.html';
    this.httpClient.get(url, {responseType: 'text'})
      .subscribe(response => this.changelogTemplate = response as string);
  }

  public onLoginButtonClick(): void {
    // We need the "ngZone.run" because otherwise the navigation would take place
    // outside the angular context which then causes an error. Using "ngZone.run"
    // executes the passed function within the context which then works perfectly.
    this.authService.requestLogin(() => this.ngZone.run(() => {
      this.websocketClientService.connect();
      this.router.navigate(['/dashboard']);
    }));
  }
}
