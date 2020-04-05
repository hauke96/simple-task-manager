import { TestBed } from '@angular/core/testing';

import { LoggedInInterceptor } from './logged-in.interceptor';
import { RouterTestingModule } from '@angular/router/testing';

describe('LoggedInInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      LoggedInInterceptor
    ],
    imports: [
      RouterTestingModule.withRoutes([])
    ]
  }));

  it('should be created', () => {
    const interceptor: LoggedInInterceptor = TestBed.inject(LoggedInInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
