import { Injectable } from '@angular/core';
import { Language } from './language';

@Injectable({
  providedIn: 'root'
})
export class SelectedLanguageService {
  selectedLanguage: Language;

  constructor() {
  }

  // Load currently selected language from local storage and set it. This might trigger a reload if the current language in the URL is not
  // the selected language.
  public loadLanguageFromLocalStorage(): boolean {
    const selectedLanguageCode = localStorage.getItem('selected_language');
    if (!!selectedLanguageCode) {
      return this.selectLanguageByCode(selectedLanguageCode);
    } else {
      return this.selectLanguageByCode(this.getDefaultLanguage().code);
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
  // Returns true when no redirect took place and false when the language changes so that location.href has been set.
  public selectLanguageByCode(languageCode: string) {
    console.log('Set lang: ' + languageCode);
    const language = this.getLanguageByCode(languageCode);

    if (!!language) {
      this.selectedLanguage = language;
    } else {
      this.selectedLanguage = this.getDefaultLanguage(); // en-US as default
    }
    localStorage.setItem('selected_language', this.selectedLanguage.code);

    // Trigger reload if new language has been selected
    const urlLanguageCode = this.urlToLanguageCode(location.pathname);
    if (urlLanguageCode !== this.selectedLanguage.code) {
      // The trailing '/' is important, otherwise the angular router will say "I don't know this route" and causes an error.
      this.loadUrl(location.origin + '/' + this.selectedLanguage.code + '/');
      return false;
    }

    return true;
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
