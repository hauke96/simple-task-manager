import { ConfigProvider } from './config.provider';
import { Config } from './config';

describe(ConfigProvider.name, () => {
  let provider: ConfigProvider;

  beforeEach(() => {
    provider = new ConfigProvider();
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('should map all fields', () => {
    const config: Config = new Config();
    config.sourceRepoUrl = 'http://my.repo/project';
    config.maxTasksPerProject = 123;
    config.maxDescriptionLength = 234;
    config.testEnvironment = true;
    expect(Object.keys(config).length).toEqual(4); // All fields filled

    provider.apply(config);

    expect(provider.sourceRepoUrl).toEqual(config.sourceRepoUrl);
    expect(provider.maxTasksPerProject).toEqual(config.maxTasksPerProject);
    expect(provider.maxDescriptionLength).toEqual(config.maxDescriptionLength);
    expect(provider.testEnvironment).toEqual(config.testEnvironment);
  });
});
