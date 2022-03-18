import { Component } from '@angular/core';
import { ConfigProvider } from './config/config.provider';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private config: ConfigProvider, private translate: TranslateService, title: Title) {
    translate.addLangs(['de', 'en-US']);
    translate.setDefaultLang('de');

    const browserLang = translate.getBrowserLang();
    translate.use(browserLang?.match(/de/) ? browserLang : 'de');

    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      translate.get('title').subscribe((res: string) => {
        title.setTitle(res);
      });
    });
  }

  get isInTestMode(): boolean {
    return this.config.testEnvironment;
  }
}
