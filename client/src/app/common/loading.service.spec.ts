import { TestBed } from '@angular/core/testing';

import { LoadingService } from './loading.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    });
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isLoading).toBeFalse();
  });

  it('should set loading state correctly', () => {
    service.start();
    expect(service.isLoading).toBeTrue();

    service.end();
    expect(service.isLoading).toBeFalse();
  });
});
