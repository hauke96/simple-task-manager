import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(LoginComponent.name, () => {
  let component: LoginComponent;
  let fixture: MockedComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    router = {} as Router;
    router.navigate = jest.fn();

    authService = {} as AuthService;

    return MockBuilder(LoginComponent, AppModule)
      .provide({
        provide: Router,
        useFactory: () => router
      })
      .provide({
        provide: AuthService,
        useFactory: () => authService
      });
  });

  beforeEach(() => {
    fixture = MockRender(LoginComponent);
    component = fixture.point.componentInstance;
    // @ts-ignore
    fixture.ngZone.run = (fn) => fn();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect user to dashboard after login', () => {
    authService.requestLogin = (fn) => fn();
    router.navigate = jest.fn();

    component.onLoginButtonClick();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
