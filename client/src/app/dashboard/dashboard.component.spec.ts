import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DashboardComponent } from './dashboard.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CurrentUserService } from '../user/current-user.service';
import { AuthService } from '../auth/auth.service';

describe(DashboardComponent.name, () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let currentUserService: CurrentUserService;
  let authService: AuthService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();

    currentUserService = TestBed.inject(CurrentUserService);
    authService = TestBed.inject(AuthService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get user name correctly', () => {
    localStorage.removeItem('auth_token');
    expect(component.userName).toBeFalsy();

    spyOn(currentUserService, 'getUserName').and.returnValue('test-user');

    expect(component.userName).toEqual('test-user');
  });

  it('should logout correctly', () => {
    const spy = spyOn(authService, 'logout');

    component.onLogoutClicked();

    expect(spy).toHaveBeenCalled();
  });
});
