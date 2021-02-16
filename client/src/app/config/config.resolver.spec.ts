import { TestBed } from '@angular/core/testing';

import { ConfigResolver } from './config.resolver';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfigProvider } from './config-provider';

describe('ConfigResolver', () => {
  let service: ConfigResolver;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ConfigResolver);

    configProvider = TestBed.inject(ConfigProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
