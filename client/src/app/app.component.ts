import { Component } from '@angular/core';
import { ConfigProvider } from './config/config.provider';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private config: ConfigProvider, private translate: TranslateService) {
    translate.addLangs(['de', 'en-US', 'es', 'fr', 'ja', 'zh-CN']);
    translate.setDefaultLang('de');
  }

  get isInTestMode(): boolean {
    return this.config.testEnvironment;
  }
}
