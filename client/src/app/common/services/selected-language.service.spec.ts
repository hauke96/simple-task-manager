import { SelectedLanguageService } from './selected-language.service';
import { Language } from '../entities/language';
import { TranslateService } from '@ngx-translate/core';

describe(SelectedLanguageService.name, () => {
  let service: SelectedLanguageService;
  let translationService: TranslateService;

  beforeEach(() => {
    translationService = {} as TranslateService;

    service = new SelectedLanguageService(translationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load language without local storage entry', () => {
    localStorage.removeItem('selected_language');
    translationService.use = jest.fn();

    service.loadLanguageFromLocalStorage();

    expect(translationService.use).toHaveBeenCalledWith('en-US');
  });

  it('should load language based on local storage', () => {
    localStorage.setItem('selected_language', 'zh-CN');
    translationService.use = jest.fn();

    service.loadLanguageFromLocalStorage();

    expect(translationService.use).toHaveBeenCalledWith('zh-CN');
    localStorage.removeItem('selected_language');
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

  it('should determine code from URL correctly', () => {
    expect(service.urlToLanguage('//de/dashboard')?.code).toEqual('de');
    expect(service.urlToLanguage('zh-CN/dashboard')?.code).toEqual('zh-CN');
    // @ts-ignore
    expect(service.urlToLanguage('/dashboard')).toEqual(undefined);
  });

  it('should get all known languages', () => {
    expect(service.getKnownLanguages().length).toEqual(6);
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
