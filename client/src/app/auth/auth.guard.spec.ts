import { AuthGuard } from './auth.guard';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { CurrentUserService } from '../user/current-user.service';

describe(AuthGuard.name, () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let currentUserService: CurrentUserService;
  let router: Router;

  beforeEach(() => {
    authService = {} as AuthService;
    currentUserService = {} as CurrentUserService;
    router = {} as Router;

    router.navigateByUrl = jest.fn();

    guard = new AuthGuard(router, authService, currentUserService);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('with authentication', () => {
    beforeEach(() => {
      authService.isAuthenticated = jest.fn().mockReturnValue(true);
      authService.setUserNameFromToken = jest.fn();
    });

    it('should not activate LoginComponent for logged-in user', () => {
      localStorage.setItem('auth_token', 'foo'); // -> logged-in user

      const canActivate = guard.canActivate({
        routeConfig: {
          path: ''
        }
      } as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(canActivate).toEqual(false);
    });

    it('should route from login to dashboard for logged-in user', () => {
      localStorage.setItem('auth_token', 'foo'); // -> logged-in user

      guard.canActivate({
        routeConfig: {
          path: ''
        }
      } as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('should activate any component for logged-in user', () => {
      localStorage.setItem('auth_token', 'foo'); // -> logged-in user

      const canActivate = guard.canActivate({
        routeConfig: {
          path: 'dashboard'
        }
      } as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(canActivate).toEqual(true);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('not authenticated', () => {
    beforeEach(() => {
      authService.isAuthenticated = jest.fn().mockReturnValue(false);
      currentUserService.resetUser = jest.fn();
    });

    it('should not activate any component for not logged-in user', () => {
      localStorage.removeItem('auth_token'); // -> not logged-in user

      const canActivate = guard.canActivate({
        routeConfig: {
          path: 'dashboard'
        }
      } as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(canActivate).toEqual(false);
      expect(currentUserService.resetUser).toHaveBeenCalled();
    });

    it('should route from any component to login for not logged-in user', () => {
      localStorage.removeItem('auth_token'); // -> not logged-in user

      guard.canActivate({
        routeConfig: {
          path: 'dashboard'
        }
      } as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
      expect(currentUserService.resetUser).toHaveBeenCalled();
    });
  });
});
