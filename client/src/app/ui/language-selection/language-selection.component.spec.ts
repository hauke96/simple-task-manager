import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSelectionComponent } from './language-selection.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SelectedLanguageService } from '../../common/services/selected-language.service';
import { Language } from '../../common/entities/language';

describe('LanguageSelectionComponent', () => {
  let component: LanguageSelectionComponent;
  let fixture: ComponentFixture<LanguageSelectionComponent>;
  let selectedLanguageService: SelectedLanguageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LanguageSelectionComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();

    selectedLanguageService = TestBed.inject(SelectedLanguageService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service to get languages', () => {
    component.languages = [];
    const serviceSpy = spyOn(selectedLanguageService, 'getKnownLanguages').and.callThrough();

    component.ngOnInit();

    expect(serviceSpy).toHaveBeenCalled();
    expect(component.languages).toBeTruthy();
    expect(component.languages.length).toEqual(5);
  });

  it('should call service to set language', () => {
    const serviceSpy = spyOn(selectedLanguageService, 'selectLanguageByCode');
    // @ts-ignore
    selectedLanguageService.selectedLanguage = new Language('en-US', 'English');

    component.onLanguageChange({target: {value: 'de'}});

    expect(serviceSpy).toHaveBeenCalledWith('de');
  });
});
