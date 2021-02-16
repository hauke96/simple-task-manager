import { TestBed } from '@angular/core/testing';

import { ConfigResolver } from './config-resolver.service';

describe('ConfigService', () => {
  let service: ConfigResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
