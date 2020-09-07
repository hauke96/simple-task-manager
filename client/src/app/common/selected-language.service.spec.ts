import { TestBed } from '@angular/core/testing';

import { SelectedLanguageService } from './selected-language.service';
import { Language } from './language';

describe('SelectedLanguageService', () => {
  let service: SelectedLanguageService;
  let spyLoadUrl: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedLanguageService);

    spyLoadUrl = spyOn<any>(service, 'loadUrl').and.callFake((url: string) => {
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set initial language without local storage entry', () => {
    service.loadLanguageFromLocalStorage();

    expect(service.selectedLanguage.code).toEqual('en-US');
  });

  it('should set initial language based on local storage', () => {
    localStorage.setItem('selected_language', 'zh-CN');

    service.loadLanguageFromLocalStorage();

    expect(service.selectedLanguage.code).toEqual('zh-CN');
    localStorage.removeItem('selected_language');
  });

  it('should triggers a reload on new language', () => {
    service.selectedLanguage = new Language('en-US', 'English'); // to see a difference below

    service.selectLanguageByCode('de');

    expect(service.selectedLanguage.code).toEqual('de');
    expect(spyLoadUrl).toHaveBeenCalledWith(location.origin + '/de/');
  });

  it('should set default language on unknown code', () => {
    service.selectLanguageByCode('foo');

    expect(service.getSelectedLanguage().code).toEqual(service.getDefaultLanguage().code);
  });

  it('should set default language on undefined', () => {
    service.selectLanguageByCode(undefined);

    expect(service.getSelectedLanguage().code).toEqual(service.getDefaultLanguage().code);
  });

  it('should determine code from URL correctly', () => {
    expect(service.urlToLanguageCode('//de/manager')).toEqual('de');
    expect(service.urlToLanguageCode('zh-CN/manager')).toEqual('zh-CN');
    expect(service.urlToLanguageCode('/manager')).toEqual(undefined);
  });

  it('should get all known languages', () => {
    expect(service.getKnownLanguages().length).toEqual(4);
  });

  it('should get correct default language', () => {
    expect(service.getDefaultLanguage().code).toEqual('en-US');
  });

  it('should get correct language for language codes', () => {
    for (const language of service.getKnownLanguages()) {
      const foundLanguage = service.getLanguageByCode(language.code);
      expect(foundLanguage.code).toEqual(language.code);
      expect(foundLanguage.name).toEqual(language.name);
    }
  });
});
