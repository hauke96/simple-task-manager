import { ConfigResolver } from './config.resolver';
import { ConfigProvider } from './config.provider';
import { HttpClient } from '@angular/common/http';
import { Config } from './config';
import { of } from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe(ConfigResolver.name, () => {
  let service: ConfigResolver;
  let httpClient: HttpClient;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    httpClient = {} as HttpClient;
    configProvider = {} as ConfigProvider;

    service = new ConfigResolver(httpClient, configProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should apply config to config provider', done => {
    const configFromServer = {
      sourceRepoUrl: 'foo',
      maxTasksPerProject: 2,
      maxDescriptionLength: 3
    } as Config;
    httpClient.get = jest.fn().mockReturnValue(of(configFromServer));
    const configProviderSpy = configProvider.apply = jest.fn();

    service.resolve({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot).subscribe(() => {
      expect(configProviderSpy).toHaveBeenCalledWith(configFromServer);
      done();
    });
  });
});
