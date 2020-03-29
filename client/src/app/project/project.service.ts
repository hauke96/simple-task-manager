import { Injectable } from '@angular/core';
import { Project } from './project.material';
import { Task } from './../task/task.material';
import { TaskService } from './../task/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projects: Project[] = [];

  constructor(private taskService: TaskService, private http: HttpClient) {
    // TODO extract this into an interceptor
    this.http.get(environment.url_projects + '?token=' + localStorage.getItem('auth_token')).subscribe(data => {
      this.projects = (data as Project[]);
    });
  }

  public getProjects(): Project[] {
    return this.projects;
  }

  public getProject(id: string): Project {
    return this.projects.find(p => p.id === id);
  }

  public createNewProject(name: string, maxPorcessPoints, geometries: [[number, number]][]) {
    // Create new tasks with the given geometries and collect their IDs
    const tasks = geometries.map(g => this.taskService.createNewTask(g, maxPorcessPoints));
    console.log(tasks);

    const p = new Project('p-' + Math.random().toString(36).substring(7), name, tasks);
    this.projects.push(p);
  }
}
