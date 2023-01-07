import { LanguageService } from './language.service';
import { Language } from '../entities/language';
import { TranslateService } from '@ngx-translate/core';

describe(LanguageService.name, () => {
  let service: LanguageService;
  let translationService: TranslateService;

  beforeEach(() => {
    translationService = {} as TranslateService;

    service = new LanguageService(translationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load language without local storage entry', () => {
    localStorage.removeItem(LanguageService.SELECTED_LANGUAGE_KEY);
    translationService.use = jest.fn();

    service.loadLanguageFromLocalStorage();

    expect(translationService.use).toHaveBeenCalledWith('en-US');
  });

  it('should load language based on local storage', () => {
    localStorage.setItem(LanguageService.SELECTED_LANGUAGE_KEY, 'de');
    translationService.use = jest.fn();

    service.loadLanguageFromLocalStorage();

    expect(translationService.use).toHaveBeenCalledWith('de');
    localStorage.removeItem(LanguageService.SELECTED_LANGUAGE_KEY);
  });

  it('should load default language for unknown value in local storage', () => {
    localStorage.setItem(LanguageService.SELECTED_LANGUAGE_KEY, 'this in an unknown language code');
    translationService.use = jest.fn();

    service.loadLanguageFromLocalStorage();

    expect(translationService.use).toHaveBeenCalledWith('en-US');
    localStorage.removeItem(LanguageService.SELECTED_LANGUAGE_KEY);
  });

  it('should triggers a reload on new language', () => {
    translationService.use = jest.fn();

    service.selectLanguageByCode('de');

    expect(translationService.use).toHaveBeenCalledWith('de');
  });

  it('should set default language on unknown code', () => {
    translationService.use = jest.fn();

    service.selectLanguageByCode('foo');

    expect(translationService.use).toHaveBeenCalledWith(service.getDefaultLanguage().code);
  });

  it('should set default language on undefined', () => {
    translationService.use = jest.fn();

    service.selectLanguageByCode(undefined);

    expect(translationService.use).toHaveBeenCalledWith(service.getDefaultLanguage().code);
  });

  it('should get correct default language', () => {
    expect(service.getDefaultLanguage().code).toEqual('en-US');
  });

  it('should get correct language for language codes', () => {
    for (const language of service.getKnownLanguages()) {
      const foundLanguage = service.getLanguageByCode(language.code);
      expect(foundLanguage?.code).toEqual(language.code);
      expect(foundLanguage?.name).toEqual(language.name);
    }
  });
});
