import { Component } from '@angular/core';
import { ConfigProvider } from './config/config.provider';
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  constructor(private config: ConfigProvider, private translate: TranslateService) {
    translate.addLangs(['de', 'en-US', 'es', 'fr', 'it']);
    translate.setDefaultLang('en-US');

    // To make locale usages (e.g. in date pipe) work
    registerLocaleData(localeEn, 'en-US');
    registerLocaleData(localeDe, 'de');
    registerLocaleData(localeEs, 'es');
    registerLocaleData(localeFr, 'fr');
    registerLocaleData(localeFr, 'it');
  }

  get isInTestMode(): boolean {
    return this.config.testEnvironment;
  }
}
