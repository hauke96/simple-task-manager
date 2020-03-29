import { Injectable } from '@angular/core';
import { Observable, zip } from 'rxjs';
import { map, flatMap, filter } from 'rxjs/operators';
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

  public createNewProject(name: string, maxProcessPoints: number, geometries: [[number, number]][]): Observable<Project> {
    // Create new tasks with the given geometries and collect their IDs
    return this.taskService.createNewTasks(geometries, maxProcessPoints)
      .pipe(flatMap(tasks => {
        return this.http.post<Project>(environment.url_projects + "?name=" + name + "&task_ids=" + tasks.map(t => t.id).join(','), "");
      }));
  }
}
