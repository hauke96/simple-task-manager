import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSelectionComponent } from './language-selection.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('LanguageSelectionComponent', () => {
  let component: LanguageSelectionComponent;
  let fixture: ComponentFixture<LanguageSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LanguageSelectionComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set initial language correctly', () => {
    const urlSegments = ['de', 'manager'];

    component.selectLanguageByUrl(urlSegments);

    expect(component.selectedLanguage.code).toEqual('de');
  });

  it('should set initial default language correctly', () => {
    component.selectedLanguage = component.languages[1]; // set a different language to check that this actually changes
    const urlSegments = ['manager'];

    component.selectLanguageByUrl(urlSegments);

    expect(component.selectedLanguage.code).toEqual('en-US');
  });
});
