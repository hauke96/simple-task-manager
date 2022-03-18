import { SelectedLanguageService } from './selected-language.service';
import { Language } from '../entities/language';

describe(SelectedLanguageService.name, () => {
  let service: SelectedLanguageService;

  beforeEach(() => {
    service = new SelectedLanguageService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load language without local storage entry', () => {
    localStorage.removeItem('selected_language');
    service.loadLanguageFromLocalStorage();

    expect(service.getSelectedLanguage()?.code).toEqual('en-US');
  });

  it('should load language based on local storage', () => {
    localStorage.setItem('selected_language', 'zh-CN');

    service.loadLanguageFromLocalStorage();

    expect(service.getSelectedLanguage()?.code).toEqual('zh-CN');
    localStorage.removeItem('selected_language');
  });

  it('should triggers a reload on new language', () => {
    // @ts-ignore
    delete global.window.location;
    // @ts-ignore
    global.window.location = {
      pathname: 'http://localhost/',
      href: '',
    };
    // @ts-ignore
    service.selectedLanguage = new Language('en-US', 'English'); // to see a difference below

    service.selectLanguageByCode('de');

    expect(service.getSelectedLanguage()?.code).toEqual('de');
    expect(window.location.href).toEqual(location.origin + '/de/');
  });

  it('should set default language on unknown code', () => {
    service.selectLanguageByCode('foo');

    expect(service.getSelectedLanguage()?.code).toEqual(service.getDefaultLanguage().code);
  });

  it('should set default language on undefined', () => {
    // @ts-ignore
    service.selectLanguageByCode(undefined);

    expect(service.getSelectedLanguage()?.code).toEqual(service.getDefaultLanguage().code);
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
