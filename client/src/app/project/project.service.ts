import { Injectable } from '@angular/core';
import { Project } from './project.material';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projects: Project[] = [];

  constructor() {
    this.projects[0] = new Project('p1', 'Test', ['t0', 't1']);
    this.projects[1] = new Project('p2', 'foo', ['t2']);
    this.projects[2] = new Project('p3', 'bar', ['t3', 't4']);
  }

  public getProjects() : Project[] {
    return this.projects;
  }

  public getProject(id: string) : Project {
    return this.projects.find(p => p.id == id);
  }

  public createNewProject(name: string) {
    const p = new Project('p-'+Math.random().toString(36).substring(7), name, []);
    this.projects.push(p);
  }
}
