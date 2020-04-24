import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';
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
  ) {
  }

  public getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(environment.url_projects);
  }

  public getProject(id: string): Observable<Project> {
    return this.http.get<Project>(environment.url_projects_by_id.replace('{id}', id));
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
    return this.http.post<Project>(environment.url_projects_users.replace('{id}', id) + '?user=' + user, '')
      .pipe(tap(p => this.projectChanged.emit(p)));
  }

  public deleteProject(id: string): Observable<any> {
    return this.http.delete(environment.url_projects + '/' + id);
  }

  // Gets the tasks of the given project
  public getTasks(id: string): Observable<Task[]> {
    return this.http.get<Task[]>(environment.url_projects + '/' + id + '/tasks')
      .pipe(
        map(tasks => tasks.map((t: Task) => new Task(t.id, t.processPoints, t.maxProcessPoints, t.geometry, t.assignedUser))));
  }

  public removeUser(id: string, user: string): Observable<any> {
    return this.http.delete(environment.url_projects_users.replace('{id}', id) + '/' + user)
      .pipe(tap(p => this.projectChanged.emit(p)));
  }
}
