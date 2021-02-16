import { TestBed } from '@angular/core/testing';

import { ConfigResolver } from './config.resolver';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfigProvider } from './config-provider';
import { HttpClient } from '@angular/common/http';
import { Config } from './config';
import { of } from 'rxjs';

describe('ConfigResolver', () => {
  let service: ConfigResolver;
  let configProvider: ConfigProvider;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ConfigResolver);

    configProvider = TestBed.inject(ConfigProvider);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should apply config to config provider', () => {
    const configFromServer = {
      sourceRepoUrl: 'foo',
      maxTasksPerProject: 2,
      maxDescriptionLength: 3
    } as Config;
    spyOn(httpClient, 'get').and.returnValue(of(configFromServer));
    const configProviderSpy = spyOn(configProvider, 'apply').and.callFake(() => {
    });

    service.resolve(null, null).subscribe(() => {
      expect(configProviderSpy).toHaveBeenCalledWith(configFromServer);
    });
  });
});
