import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
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
  }

  public getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(environment.url_projects);
  }

  public getProject(id: string): Observable<Project> {
    return this.getProjects().pipe(map(projects => {
      const p = projects.find(p => p.id === id);
      console.log(p);
      return p;
    }));
  }

  public createNewProject(name: string, maxPorcessPoints, geometries: [[number, number]][]) {
    // Create new tasks with the given geometries and collect their IDs
    const tasks = geometries.map(g => this.taskService.createNewTask(g, maxPorcessPoints));
    console.log(tasks);

    const p = new Project('p-' + Math.random().toString(36).substring(7), name, tasks);

    // TODO make server call
    this.projects.push(p);
  }
}
