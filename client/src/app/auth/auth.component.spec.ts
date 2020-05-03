import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthComponent } from './auth.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NgZone } from '@angular/core';
import { MockRouter } from '../common/mock-router';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: AuthService;
  let routerMock: MockRouter;

  beforeEach(async(() => {
    const mockNgZone = jasmine.createSpyObj('mockNgZone', ['run', 'runOutsideAngular']);
    mockNgZone.run.and.callFake(fn => fn());

    TestBed.configureTestingModule({
      declarations: [AuthComponent],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        UserService,
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
    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect authenticated user to manager', () => {
    spyOn(authService, 'requestLogin').and.callFake((f: () => void) => {
      f();
    });
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    spyOn(routerMock, 'navigate').and.callThrough();

    component.ngOnInit();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/manager']);
  });

  it('should not redirect unauthenticated user to manager', () => {
    spyOn(authService, 'requestLogin').and.callFake((f: () => void) => {
      f();
    });
    spyOn(authService, 'isAuthenticated').and.returnValue(false);
    spyOn(routerMock, 'navigate').and.callThrough();

    component.ngOnInit();

    expect(routerMock.navigate).not.toHaveBeenCalledWith(['/manager']);
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
