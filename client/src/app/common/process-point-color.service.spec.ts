import { TestBed } from '@angular/core/testing';

import { ProcessPointColorService } from './process-point-color.service';

describe('ProcessPointColorService', () => {
  let service: ProcessPointColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessPointColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
