import { OauthLandingComponent } from './oauth-landing.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(OauthLandingComponent.name, () => {
  let component: OauthLandingComponent;
  let fixture: MockedComponentFixture<OauthLandingComponent>;

  beforeEach(() => {
    const activeRoute = {
      queryParams: of([{
        auth_token: 'abc123'
      }])
    };

    window.close = jest.fn();

    return MockBuilder(OauthLandingComponent, AppModule)
      .provide({
        provide: ActivatedRoute,
        useFactory: () => activeRoute
      });
  });

  beforeEach(() => {
    fixture = MockRender(OauthLandingComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call close on window', () => {
    expect(window.close).toHaveBeenCalled();
  });
});
