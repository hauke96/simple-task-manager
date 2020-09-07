import { Injectable } from '@angular/core';
import { Language } from './language';

@Injectable({
  providedIn: 'root'
})
export class SelectedLanguageService {
  selectedLanguage: Language;

  constructor() {
    this.loadLanguageFromLocalStorage();
  }

  // Load currently selected language from local storage and set it. If no language is present, the default language is used
  public loadLanguageFromLocalStorage() {
    const selectedLanguageCode = localStorage.getItem('selected_language');
    if (!!selectedLanguageCode) {
      this.selectedLanguage = this.getLanguageByCode(selectedLanguageCode);
    } else {
      this.selectedLanguage = this.getLanguageByCode(this.getDefaultLanguage().code);
    }
  }

  public getKnownLanguages(): Language[] {
    // Always return new array, so that caller cannot change the set of available languages
    return [
      new Language('en-US', 'English'),
      new Language('de', 'Deutsch'),
      new Language('ja', '日本人'),
      new Language('zh-CN', '中文'),
    ];
  }

  public getSelectedLanguage(): Language {
    return this.selectedLanguage;
  }

  public urlToLanguageCode(url: string): string {
    url = url.replace(/^\/*/g, ''); // remove leading slashes. Turn '//de/manager' into 'de/manager'
    const urlSegments = url.split('/'); // now split e.g. 'de/manager' into ['de', 'manager']
    const languageCode = urlSegments[0];
    return this.getLanguageByCode(languageCode)?.code; // to make sure the found language code exists
  }

  // This sets the "this.selectedLanguage" field and triggers a reload if a different language has been selected as the one currently active
  // within the URL (location.pathname).
  public selectLanguageByCode(languageCode: string) {
    const language = this.getLanguageByCode(languageCode);

    if (!!language) {
      this.selectedLanguage = language;
    } else {
      this.selectedLanguage = this.getDefaultLanguage(); // en-US as default
    }

    // Trigger reload if new language has been selected
    const urlLanguageCode = this.urlToLanguageCode(location.pathname);
    if (urlLanguageCode !== this.selectedLanguage.code) {
      // The trailing '/' is important, otherwise the angular router will say "I don't know this route" and causes an error.
      this.loadUrl(location.origin + '/' + this.selectedLanguage.code + '/');
    }
  }

  private loadUrl(newUrl: string) {
    location.href = newUrl;
  }

  public getLanguageByCode(languageCode: string): Language {
    return this.getKnownLanguages().find(l => l.code === languageCode);
  }

  public getDefaultLanguage(): Language {
    return this.getKnownLanguages()[0];
  }
}
