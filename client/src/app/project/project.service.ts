import { EventEmitter, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { flatMap, map, mergeMap, tap } from 'rxjs/operators';
import { Project, ProjectDto } from './project.material';
import { Task } from './../task/task.material';
import { TaskService } from './../task/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projectChanged: EventEmitter<Project> = new EventEmitter();

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private http: HttpClient
  ) {
  }

  public getProjects(): Observable<Project[]> {
    return this.http.get<ProjectDto[]>(environment.url_projects)
      .pipe(flatMap(dtos => this.toProjects(dtos)));
  }

  public getProject(projectId: string): Observable<Project> {
    return this.http.get<ProjectDto>(environment.url_projects_by_id.replace('{id}', projectId))
      .pipe(flatMap(dto => this.toProject(dto)));
  }

  public createNewProject(
    name: string,
    maxProcessPoints: number,
    projectDescription: string,
    geometries: [number, number][][],
    users: string[],
    owner: string
  ): Observable<Project> {
    // Create new tasks with the given geometries and collect their IDs
    return this.taskService.createNewTasks(geometries, maxProcessPoints)
      .pipe(
        flatMap(tasks => {
          const p = new ProjectDto('', name, projectDescription, tasks.map(t => t.id), users, owner);
          return this.http.post<ProjectDto>(environment.url_projects, JSON.stringify(p))
            .pipe(flatMap(dto => this.toProject(dto)));
        })
      );
  }

  public inviteUser(projectId: string, userId: string): Observable<Project> {
    return this.http.post<ProjectDto>(environment.url_projects_users.replace('{id}', projectId) + '?uid=' + userId, '')
      .pipe(
        flatMap(dto => this.toProject(dto)),
        tap(p => this.projectChanged.emit(p))
      );
  }

  public deleteProject(projectId: string): Observable<any> {
    return this.http.delete(environment.url_projects + '/' + projectId);
  }

  // Gets the tasks of the given project
  public getTasks(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(environment.url_projects + '/' + projectId + '/tasks')
      .pipe(
        flatMap(tasks => {
          return this.taskService.addUserNames(tasks);
        })
      );
  }

  public removeUser(projectId: string, userId: string): Observable<Project> {
    return this.http.delete<ProjectDto>(environment.url_projects_users.replace('{id}', projectId) + '/' + userId)
      .pipe(
        flatMap(dto => this.toProject(dto)),
        tap(p => this.projectChanged.emit(p))
      );
  }

  // Gets user names and turns the DTO into a Project
  private toProject(dto: ProjectDto): Observable<Project> {
    return this.toProjects([dto]).pipe(map(p => p[0]));
  }

  // Gets user names and turns the DTOs into Projects
  private toProjects(dtos: ProjectDto[]): Observable<Project[]> {
    if (!dtos || dtos.length === 0) {
      return of([]);
    }

    const projectUserIDs = dtos.map(p => [p.owner, ...p.users]); // array of arrays
    let userIDs = [].concat.apply([], projectUserIDs); // array of strings
    userIDs = [...new Set(userIDs)]; // array of strings without duplicates

    return this.userService.getUsersByIds(userIDs)
      .pipe(
        map((allUsers: User[]) => {
          const projects: Observable<Project>[] = [];

          for (const p of dtos) {
            const owner = allUsers.find(u => p.owner === u.uid);
            const users = allUsers.filter(u => p.users.includes(u.uid));

            projects.push(this.toProjectWithTasks(p, users, owner));
          }

          return projects;
        }),
        // Turn Observable<Observable<Project>[]> into Observable<Project[]>
        mergeMap((a: Observable<Project>[]) => forkJoin(a))
      );
  }

  // Takes the given project dto, the owner, users, gets the tasks from the server and build an Project object
  private toProjectWithTasks(p: ProjectDto, users: User[], owner: User): Observable<Project> {
    return this.getTasks(p.id).pipe(
      map(tasks => {
        return new Project(
          p.id,
          p.name,
          p.description,
          tasks,
          users,
          owner,
          p.needsAssignment,
          p.totalProcessPoints,
          p.doneProcessPoints);
      })
    );
  }
}
