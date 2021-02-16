import { TestBed } from '@angular/core/testing';
import { ConfigProvider } from './config.provider';
import { Config } from './config';

describe('ConfigProvider', () => {
  let provider: ConfigProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(ConfigProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('should map all fields', () => {
    const config: Config = new Config();
    config.sourceRepoUrl = 'http://my.repo/project';
    config.maxTasksPerProject = 123;
    config.maxDescriptionLength = 234;
    expect(Object.keys(config).length).toEqual(3); // All fields filled

    provider.apply(config);

    expect(provider.sourceRepoUrl).toEqual(config.sourceRepoUrl);
    expect(provider.maxTasksPerProject).toEqual(config.maxTasksPerProject);
    expect(provider.maxDescriptionLength).toEqual(config.maxDescriptionLength);
  });
});
