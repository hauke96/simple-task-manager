import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading.service';
import { ReplaySubject } from 'rxjs';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterEvent } from '@angular/router';

describe('LoadingService', () => {
  let service: LoadingService;

  const routerEventSubject = new ReplaySubject<RouterEvent>();
  const routerMock = {
    navigate: jasmine.createSpy('navigate'),
    events: routerEventSubject.asObservable(),
    url: '/foo/bar'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provider: Router,
          useValue: routerMock
        }
      ]
    });
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isLoading()).toBeFalse();
  });

  it('should set loading state correctly', () => {
    service.start();
    expect(service.isLoading()).toBeTrue();

    service.end();
    expect(service.isLoading()).toBeFalse();
  });

  it('should start loading on routing start event', () => {
    routerEventSubject.next(new NavigationStart(1, '/foo/bar'));
    expect(service.isLoading()).toBeTrue();
  });

  describe('navigation end events', () => {
    beforeEach(() => {
      service.start();
    });

    it('should end loading on navigation error', () => {
      routerEventSubject.next(new NavigationError(1, '/foo/bar', 'some error'));
      expect(service.isLoading()).toBeFalse();
    });

    it('should end loading on navigation cancellation', () => {
      routerEventSubject.next(new NavigationCancel(1, '/foo/bar', 'some error'));
      expect(service.isLoading()).toBeFalse();
    });

    it('should end loading on navigation end', () => {
      routerEventSubject.next(new NavigationEnd(1, '/foo/bar', '/some/other/url'));
      expect(service.isLoading()).toBeFalse();
    });
  });
});
