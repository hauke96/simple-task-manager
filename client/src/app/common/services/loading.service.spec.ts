import { LoadingService } from './loading.service';
import { ReplaySubject } from 'rxjs';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterEvent } from '@angular/router';

describe(LoadingService.name, () => {
  const routerEventSubject = new ReplaySubject<RouterEvent>();

  let service: LoadingService;
  let router: Router;

  beforeEach(() => {
    router = {
      events: routerEventSubject.asObservable()
    } as Router;

    service = new LoadingService(router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set loading state correctly', () => {
    service.start();
    expect(service.isLoading()).toEqual(true);

    service.end();
    expect(service.isLoading()).toEqual(false);
  });

  it('should start loading on routing start event', () => {
    routerEventSubject.next(new NavigationStart(1, '/foo/bar'));
    expect(service.isLoading()).toEqual(true);
  });

  describe('navigation end events', () => {
    beforeEach(() => {
      service.start();
    });

    it('should end loading on navigation error', () => {
      routerEventSubject.next(new NavigationError(1, '/foo/bar', 'some error'));
      expect(service.isLoading()).toEqual(false);
    });

    it('should end loading on navigation cancellation', () => {
      routerEventSubject.next(new NavigationCancel(1, '/foo/bar', 'some error'));
      expect(service.isLoading()).toEqual(false);
    });

    it('should end loading on navigation end', () => {
      routerEventSubject.next(new NavigationEnd(1, '/foo/bar', '/some/other/url'));
      expect(service.isLoading()).toEqual(false);
    });
  });
});
