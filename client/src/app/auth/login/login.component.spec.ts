import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(LoginComponent.name, () => {
  let component: LoginComponent;
  let fixture: MockedComponentFixture<LoginComponent>;
  let authService: AuthService;
  let routerMock: Router;

  beforeEach(() => {
    routerMock = {} as Router;
    routerMock.navigate = jest.fn();

    authService = {} as AuthService;

    return MockBuilder(LoginComponent, AppModule)
      .provide({
        provide: Router,
        useFactory: () => routerMock
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
    routerMock.navigate = jest.fn();

    component.onLoginButtonClick();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
