import { EventEmitter, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Project, ProjectAddDto, ProjectDraftDto, ProjectDto, ProjectExport } from './project.material';
import { TaskDraftDto } from './../task/task.material';
import { TaskService } from './../task/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';
import { WebsocketClientService } from '../common/websocket-client.service';
import { WebsocketMessage, WebsocketMessageType } from '../common/websocket-message';
import { NotificationService } from '../common/notification.service';
import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projectAdded: EventEmitter<Project> = new EventEmitter();
  public projectChanged: EventEmitter<Project> = new EventEmitter();
  public projectDeleted: EventEmitter<string> = new EventEmitter();
  public projectUserRemoved: EventEmitter<string> = new EventEmitter();

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private http: HttpClient,
    private websocketClient: WebsocketClientService,
    private notificationService: NotificationService
  ) {
    websocketClient.messageReceived.subscribe((m: WebsocketMessage) => {
      this.handleReceivedMessage(m);
    }, e => {
      console.error(e);
      this.notificationService.addError($localize`:@@ERROR_LIVE_UPDATE:Could not initialize live-updates`);
    });
  }

  private handleReceivedMessage(m: WebsocketMessage) {
    switch (m.type) {
      case WebsocketMessageType.MessageType_ProjectAdded:
        this.getProject(m.id).subscribe(
          p => {
            this.projectAdded.emit(p);
          },
          e => {
            console.error('Unable to process ' + m.type + ' event for project ' + m.id);
            console.error(e);
          }
        );
        break;
      case WebsocketMessageType.MessageType_ProjectUpdated:
        this.getProject(m.id).subscribe(
          p => {
            // Also call the task service to send task-updates to the components.
            this.taskService.updateTasks(p.tasks);
            this.projectChanged.emit(p);
          },
          e => {
            console.error('Unable to process ' + m.type + ' event for project ' + m.id);
            console.error(e);
          }
        );
        break;
      case WebsocketMessageType.MessageType_ProjectUserRemoved:
        this.projectUserRemoved.emit(m.id);
        break;
      case WebsocketMessageType.MessageType_ProjectDeleted:
        this.projectDeleted.emit(m.id);
        break;
    }
  }

  public getProjects(): Observable<Project[]> {
    return this.http.get<ProjectDto[]>(environment.url_projects)
      .pipe(mergeMap(dtos => this.toProjects(dtos)));
  }

  public getProject(projectId: string): Observable<Project> {
    return this.http.get<ProjectDto>(environment.url_projects_by_id.replace('{id}', projectId))
      .pipe(mergeMap(dto => this.toProject(dto)));
  }

  public createNewProject(
    name: string,
    maxProcessPoints: number,
    projectDescription: string,
    features: Feature[],
    users: string[],
    owner: string
  ): Observable<Project> {
    const format = new GeoJSON();
    // We want features to attach attributes and to not be bound to one single Polygon.
    // Furthermore the escaping in the string breaks the format as the "\" character is actually transmitted as "\" character
    const geometries: string[] = [];
    for (const feature of features) {
      geometries.push(format.writeFeature(feature));
    }

    const p = new ProjectAddDto(
      new ProjectDraftDto(name, projectDescription, users, owner),
      geometries.map(g => new TaskDraftDto(maxProcessPoints, g))
    );

    return this.http.post<ProjectDto>(environment.url_projects, JSON.stringify(p))
      .pipe(mergeMap(dto => this.toProject(dto)));
  }

  public inviteUser(projectId: string, userId: string): Observable<void> {
    return this.http.post<void>(environment.url_projects_users.replace('{id}', projectId) + '?uid=' + userId, '');
  }

  public deleteProject(projectId: string): Observable<any> {
    return this.http.delete(environment.url_projects + '/' + projectId);
  }

  public removeUser(projectId: string, userId: string): Observable<Project> {
    return this.http.delete<ProjectDto>(environment.url_projects_users.replace('{id}', projectId) + '/' + userId)
      .pipe(
        mergeMap(dto => this.toProject(dto)),
        tap(p => this.projectChanged.emit(p))
      );
  }

  public updateName(projectId: string, newName: string) {
    return this.http.put<ProjectDto>(environment.url_projects_name.replace('{id}', projectId), newName)
      .pipe(
        mergeMap(dto => this.toProject(dto)),
        tap(p => this.projectChanged.emit(p))
      );
  }

  public updateDescription(projectId: string, newDescription: string) {
    return this.http.put<ProjectDto>(environment.url_projects_description.replace('{id}', projectId), newDescription)
      .pipe(
        mergeMap(dto => this.toProject(dto)),
        tap(p => this.projectChanged.emit(p))
      );
  }

  public getProjectExport(projectId: string): Observable<ProjectExport> {
    return this.http.get<ProjectExport>(environment.url_projects_export.replace('{id}', projectId));
  }

  public leaveProject(projectId: string): Observable<any> {
    return this.http.delete(environment.url_projects_users.replace('{id}', projectId));
  }

  // Gets user names and turns the DTO into a Project
  public toProject(dto: ProjectDto): Observable<Project> {
    return this.toProjects([dto]).pipe(map(p => p[0]));
  }

  // Gets user names and turns the DTOs into Projects
  public toProjects(dtos: ProjectDto[]): Observable<Project[]> {
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
    return of(new Project(
      p.id,
      p.name,
      p.description,
      p.tasks.map(dto => this.taskService.toTask(dto)),
      users,
      owner,
      p.needsAssignment,
      p.creationDate,
      p.totalProcessPoints,
      p.doneProcessPoints
    ));
  }
}
