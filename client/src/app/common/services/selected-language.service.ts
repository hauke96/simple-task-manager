import { Injectable } from '@angular/core';
import { Language } from '../entities/language';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class SelectedLanguageService {
  constructor(private translationService: TranslateService) {
  }

  /**
   * Load currently selected language from local storage and set it. This might trigger a reload if the current language in the URL is not
   * the selected language.
   *
   * @return true when no redirect took place and false when the language changes so that location.href has been set.
   */
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
      new Language('ja', '日本語'),
      new Language('zh-CN', '中文'),
      new Language('fr', 'Français'),
      new Language('es', 'Español'),
    ];
  }

  public getSelectedLanguage(): Language | undefined {
    return this.getLanguageByCode(this.translationService.currentLang);
  }

  public urlToLanguage(url: string): Language | undefined {
    url = url.replace(/^\/*/g, ''); // remove leading slashes. Turn '//de/dashboard' into 'de/dashboard'
    const urlSegments = url.split('/'); // now split e.g. 'de/dashboard' into ['de', 'dashboard']
    const languageCode = urlSegments[0];
    return this.getLanguageByCode(languageCode);
  }

  /**
   * This sets the "this.selectedLanguage" field and triggers a reload if a different language has been selected as the one currently active
   * within the URL (location.pathname).
   *
   * @return true when no redirect took place and false when the language changes so that location.href has been set.
   */
  public selectLanguageByCode(languageCode: string | undefined): boolean {
    const language = this.getLanguageByCode(languageCode) ?? this.getDefaultLanguage();

    this.translationService.use(language.code);
    localStorage.setItem('selected_language', language.code);

    return true;
  }

  /**
   * @return The Language object or 'undefined' if language code not known by 'getKnownLanguages()'.
   */
  public getLanguageByCode(languageCode: string | undefined): Language | undefined {
    return this.getKnownLanguages().find(l => l.code === languageCode);
  }

  public getDefaultLanguage(): Language {
    return this.getKnownLanguages()[0];
  }
}
