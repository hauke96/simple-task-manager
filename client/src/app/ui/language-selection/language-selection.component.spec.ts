import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSelectionComponent } from './language-selection.component';
import { SelectedLanguageService } from '../../common/services/selected-language.service';
import { Language } from '../../common/entities/language';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { ActivatedRoute } from '@angular/router';

describe(LanguageSelectionComponent.name, () => {
  let component: LanguageSelectionComponent;
  let fixture: MockedComponentFixture<LanguageSelectionComponent>;
  let selectedLanguageService: SelectedLanguageService;

  beforeEach(async () => {
    selectedLanguageService = {} as SelectedLanguageService;
    selectedLanguageService.getKnownLanguages = jest.fn();
    selectedLanguageService.getSelectedLanguage = jest.fn();
    const activatedRoute = {} as unknown as ActivatedRoute;

    return MockBuilder(LanguageSelectionComponent, AppModule)
      .provide({provide: ActivatedRoute, useFactory: () => activatedRoute})
      .provide({provide: SelectedLanguageService, useFactory: () => selectedLanguageService});
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
    selectedLanguageService.getKnownLanguages = jest.fn().mockReturnValue(languages);

    component.ngOnInit();

    expect(component.languages).toEqual(languages);
    expect(component.languages.length).toEqual(languages.length);
  });

  it('should call service to set language', () => {
    selectedLanguageService.selectLanguageByCode = jest.fn();
    // @ts-ignore
    selectedLanguageService.selectedLanguage = new Language('en-US', 'English');

    component.onLanguageChange({target: {value: 'de'}});

    expect(selectedLanguageService.selectLanguageByCode).toHaveBeenCalledWith('de');
  });
});
