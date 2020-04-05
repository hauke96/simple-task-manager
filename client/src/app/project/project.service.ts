import { Injectable, EventEmitter } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, flatMap, tap } from 'rxjs/operators';
import { Project } from './project.material';
import { Task } from './../task/task.material';
import { TaskService } from './../task/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projectChanged: EventEmitter<Project> = new EventEmitter();

  constructor(
    private taskService: TaskService,
    private http: HttpClient
  ) { }

  public getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(environment.url_projects);
  }

  public getProject(id: string): Observable<Project> {
    return this.getProjects()
      .pipe(map(projects => {
        const project = projects.find(p => p.id === id);

        if (!project) {
          throw new Error('Project not found');
        }

        return project;
      })
    );
  }

  public createNewProject(name: string, maxProcessPoints: number, geometries: [[number, number]][]): Observable<Project> {
    // Create new tasks with the given geometries and collect their IDs
    return this.taskService.createNewTasks(geometries, maxProcessPoints)
      .pipe(flatMap(tasks => {
        const p = new Project('', name, tasks.map(t => t.id));
        return this.http.post<Project>(environment.url_projects, JSON.stringify(p));
      }));
  }

  public inviteUser(user: string, id: string): Observable<Project> {
    return this.http.post<Project>(environment.url_projects_users + '?user=' + user + '&project=' + id, '')
      .pipe(tap(p => this.projectChanged.emit(p)));
  }
}
