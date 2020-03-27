import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projects: string[] = [];

  constructor() {
    this.projects[0] = 'Test';
    this.projects[1] = 'foo';
    this.projects[2] = 'bar';
  }

  public getProjects() {
    return this.projects;
  }
}
