import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OauthLandingComponent } from './oauth-landing.component';

describe('OauthLandingComponent', () => {
  let component: OauthLandingComponent;
  let fixture: ComponentFixture<OauthLandingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OauthLandingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OauthLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
