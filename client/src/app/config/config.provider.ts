import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Config } from './config';

/**
 * This config provider is a simple class providing the configurations received from the server (s. the ConfigResolver class). These
 * configurations are used to ensure valid requests to the server (e.g. to not exceed the maximum length for a project description).
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigProvider extends Config {
  constructor() {
    super();
  }
  public apply(config: Config) {
    this.sourceRepoUrl = config.sourceRepoUrl;
    this.maxTasksPerProject = config.maxTasksPerProject;
    this.maxDescriptionLength = config.maxDescriptionLength;
    this.testEnvironment = config.testEnvironment;
  }
}
