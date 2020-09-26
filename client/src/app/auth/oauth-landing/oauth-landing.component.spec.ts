import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OauthLandingComponent } from './oauth-landing.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('OauthLandingComponent', () => {
  let component: OauthLandingComponent;
  let fixture: ComponentFixture<OauthLandingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OauthLandingComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of([{
              auth_token: 'abc123'
            }])
          }
        }
      ]
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
