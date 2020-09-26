import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { MockRouter } from '../common/mock-router';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const mockRouter = new MockRouter();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Router,
          useValue: mockRouter
        }
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should not activate LoginComponent for logged-in user', () => {
    localStorage.setItem('auth_token', 'foo'); // -> logged-in user

    const canActivate = guard.canActivate({
      routeConfig: {
        path: ''
      }
    } as ActivatedRouteSnapshot, undefined);

    expect(canActivate).toBeFalse();
  });

  it('should route from login to manager for logged-in user', () => {
    const routerSpy = spyOn(mockRouter, 'navigateByUrl');

    localStorage.setItem('auth_token', 'foo'); // -> logged-in user

    guard.canActivate({
      routeConfig: {
        path: ''
      }
    } as ActivatedRouteSnapshot, undefined);

    expect(routerSpy).toHaveBeenCalledWith('/manager');
  });

  it('should not activate any component for not logged-in user', () => {
    localStorage.removeItem('auth_token'); // -> not logged-in user

    const canActivate = guard.canActivate({
      routeConfig: {
        path: 'manager'
      }
    } as ActivatedRouteSnapshot, undefined);

    expect(canActivate).toBeFalse();
  });

  it('should route from any component to login for not logged-in user', () => {
    const routerSpy = spyOn(mockRouter, 'navigateByUrl');

    localStorage.removeItem('auth_token'); // -> not logged-in user

    guard.canActivate({
      routeConfig: {
        path: 'manager'
      }
    } as ActivatedRouteSnapshot, undefined);

    expect(routerSpy).toHaveBeenCalledWith('/');
  });

  it('should activate any component for logged-in user', () => {
    const routerSpy = spyOn(mockRouter, 'navigateByUrl');

    localStorage.setItem('auth_token', 'foo'); // -> logged-in user

    const canActivate = guard.canActivate({
      routeConfig: {
        path: 'manager'
      }
    } as ActivatedRouteSnapshot, undefined);

    expect(canActivate).toBeTrue();
    expect(routerSpy).not.toHaveBeenCalled();
  });
});
