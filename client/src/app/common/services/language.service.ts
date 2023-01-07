import { Injectable } from '@angular/core';
import { Language } from '../entities/language';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  static readonly SELECTED_LANGUAGE_KEY = 'selected_language';

  constructor(private translationService: TranslateService) {
  }

  /**
   * Load currently selected language from local storage and set it. This might trigger a reload if the current language in the URL is not
   * the selected language.
   *
   * @return true when no redirect took place and false when the language changes so that location.href has been set.
   */
  public loadLanguageFromLocalStorage(): boolean {
    const selectedLanguageCode = localStorage.getItem(LanguageService.SELECTED_LANGUAGE_KEY);
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
      new Language('es', 'Español'),
    ];
  }

  public getSelectedLanguage(): Language | undefined {
    return this.getLanguageByCode(this.translationService.currentLang);
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
    localStorage.setItem(LanguageService.SELECTED_LANGUAGE_KEY, language.code);

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
