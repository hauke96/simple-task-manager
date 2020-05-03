import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerComponent } from './manager.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';

describe('ManagerComponent', () => {
  let component: ManagerComponent;
  let fixture: ComponentFixture<ManagerComponent>;
  let userService: UserService;
  let authService: AuthService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ManagerComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();

    userService = TestBed.inject(UserService);
    authService = TestBed.inject(AuthService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get user name correctly', () => {
    localStorage.removeItem('auth_token');
    expect(component.userName).toBeFalsy();

    spyOn(userService, 'getUser').and.returnValue('test-user');

    expect(component.userName).toEqual('test-user');
  });

  it('should logout correctly', () => {
    const spy = spyOn(authService, 'logout');

    component.onLogoutClicked();

    expect(spy).toHaveBeenCalled();
  });
});
