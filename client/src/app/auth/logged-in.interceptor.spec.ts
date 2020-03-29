import { TestBed } from '@angular/core/testing';

import { LoggedInInterceptor } from './logged-in.interceptor';

describe('LoggedInInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      LoggedInInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: LoggedInInterceptor = TestBed.inject(LoggedInInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
