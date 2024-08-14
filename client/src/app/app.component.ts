import { Component } from '@angular/core';
import { ConfigProvider } from './config/config.provider';
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private config: ConfigProvider, private translate: TranslateService) {
    translate.addLangs(['de', 'en-US', 'es']);
    translate.setDefaultLang('en-US');

    // To make locale usages (e.g. in date pipe) work
    registerLocaleData(localeEn, 'en-US');
    registerLocaleData(localeDe, 'de');
    registerLocaleData(localeEs, 'es');
  }

  get isInTestMode(): boolean {
    return this.config.testEnvironment;
  }
}
