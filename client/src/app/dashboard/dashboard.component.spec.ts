import { DashboardComponent } from './dashboard.component';
import { CurrentUserService } from '../user/current-user.service';
import { AuthService } from '../auth/auth.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../app.module';

describe(DashboardComponent.name, () => {
  let component: DashboardComponent;
  let fixture: MockedComponentFixture<DashboardComponent>;
  let currentUserService: CurrentUserService;
  let authService: AuthService;

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    currentUserService.getUserName = jest.fn();
    authService = {} as AuthService;

    return MockBuilder(DashboardComponent, AppModule)
      .provide({provide: CurrentUserService, useFactory: () => currentUserService})
      .provide({provide: AuthService, useFactory: () => authService});
  });

  beforeEach(() => {
    fixture = MockRender(DashboardComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get user name correctly', () => {
    localStorage.removeItem('auth_token');
    expect(component.userName).toBeFalsy();

    currentUserService.getUserName = jest.fn().mockReturnValue('test-user');

    expect(component.userName).toEqual('test-user');
  });

  it('should logout correctly', () => {
    authService.logout = jest.fn();

    component.onLogoutClicked();

    expect(authService.logout).toHaveBeenCalled();
  });
});
