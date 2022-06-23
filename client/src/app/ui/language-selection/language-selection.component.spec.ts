import { LanguageSelectionComponent } from './language-selection.component';
import { LanguageService } from '../../common/services/language.service';
import { Language } from '../../common/entities/language';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { ActivatedRoute } from '@angular/router';

describe(LanguageSelectionComponent.name, () => {
  let component: LanguageSelectionComponent;
  let fixture: MockedComponentFixture<LanguageSelectionComponent>;
  let languageService: LanguageService;

  beforeEach(async () => {
    languageService = {} as LanguageService;
    languageService.getKnownLanguages = jest.fn();
    languageService.getSelectedLanguage = jest.fn();
    const activatedRoute = {} as unknown as ActivatedRoute;

    return MockBuilder(LanguageSelectionComponent, AppModule)
      .provide({provide: ActivatedRoute, useFactory: () => activatedRoute})
      .provide({provide: LanguageService, useFactory: () => languageService});
  });

  beforeEach(() => {
    fixture = MockRender(LanguageSelectionComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service to get languages', () => {
    const languages = [
      new Language('en-US', 'English'),
      new Language('de', 'Deutsch'),
      new Language('test', 'Testish'),
    ];
    component.languages = [];
    languageService.getKnownLanguages = jest.fn().mockReturnValue(languages);

    component.ngOnInit();

    expect(component.languages).toEqual(languages);
    expect(component.languages.length).toEqual(languages.length);
  });

  it('should call service to set language', () => {
    languageService.selectLanguageByCode = jest.fn();
    // @ts-ignore
    languageService.selectedLanguage = new Language('en-US', 'English');

    component.onLanguageChange({target: {value: 'de'}});

    expect(languageService.selectLanguageByCode).toHaveBeenCalledWith('de');
  });
});
