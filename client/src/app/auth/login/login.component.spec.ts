import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { MockRouter } from '../../common/mock-router';

describe('AuthComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let routerMock: MockRouter;

  beforeEach(waitForAsync(() => {
    const mockNgZone = jasmine.createSpyObj('mockNgZone', ['run', 'runOutsideAngular']);
    mockNgZone.run.and.callFake((fn: any) => fn());

    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        CurrentUserService,
        AuthService,
        {
          provide: Router,
          useClass: MockRouter
        },
        {
          provide: NgZone,
          useValue: new NgZone({})
        }
      ]
    })
      .compileComponents();

    authService = TestBed.inject(AuthService);
    routerMock = TestBed.inject(Router);

    const ngZone = TestBed.inject(NgZone);
    spyOn(ngZone, 'run').and.callFake((fn: () => any) => fn());
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect user to manager after login', () => {
    spyOn(authService, 'requestLogin').and.callFake((f: () => void) => {
      f();
    });
    spyOn(routerMock, 'navigate').and.callThrough();

    component.onLoginButtonClick();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/manager']);
  });
});
