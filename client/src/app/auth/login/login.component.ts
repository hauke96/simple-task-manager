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
  public noticeTemplate: string;
  public changelogTemplate: string;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private authService: AuthService,
    private websocketClientService: WebsocketClientService,
    private httpClient: HttpClient,
    private translationService: TranslateService
  ) {
    this.loadTemplates();

    translationService.onLangChange.subscribe(() => this.loadTemplates());
  }

  private loadTemplates(): void {
    this.changelogTemplate = '';
    const changelogTemplateUrl = 'assets/i18n/changelog.' + this.translationService.currentLang + '.html';
    this.httpClient.get(changelogTemplateUrl, {responseType: 'text'})
      .subscribe({
        next: response => this.changelogTemplate = response,
        error: () => void 0 // Do nothing in case of error, the user would not be able to do anything here
      });

    this.noticeTemplate = '';
    const noticeTemplateUrl = 'assets/i18n/notice.' + this.translationService.currentLang + '.html';
    this.httpClient.get(noticeTemplateUrl, {responseType: 'text'})
      .subscribe({
        next: response => this.noticeTemplate = response,
        error: () => void 0 // Do nothing in case of error, the user would not be able to do anything here
      });
  }

  public onLoginButtonClick(): void {
    // We need the "ngZone.run" because otherwise the navigation would take place
    // outside the angular context which then causes an error. Using "ngZone.run"
    // executes the passed function within the context which then works perfectly.
    this.authService.requestLogin(() => this.ngZone.run(() => {
      this.router.navigate(['/dashboard']);
    }));
  }
}
