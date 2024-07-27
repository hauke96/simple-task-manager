import { EventEmitter, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Project, ProjectAddDto, ProjectDraftDto, ProjectDto, ProjectExport, ProjectUpdateDto } from './project.material';
import { Task, TaskDraftDto, TaskDto } from './../task/task.material';
import { TaskService } from './../task/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';
import { WebsocketClientService } from '../common/services/websocket-client.service';
import { WebsocketMessage, WebsocketMessageType } from '../common/entities/websocket-message';
import { NotificationService } from '../common/services/notification.service';
import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Geometry } from 'ol/geom';
import { TranslateService } from '@ngx-translate/core';
import { CommentService } from '../comments/comment.service';
import { CommentDraftDto } from '../comments/comment.material';
import { JosmDataSource } from '../common/entities/josm-data-source';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public projectAdded: EventEmitter<Project> = new EventEmitter<Project>();
  public projectChanged: EventEmitter<Project> = new EventEmitter<Project>();
  public projectDeleted: EventEmitter<string> = new EventEmitter<string>();
  public projectUserRemoved: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private http: HttpClient,
    private notificationService: NotificationService,
    private translationService: TranslateService,
    private commentService: CommentService,
    websocketClient: WebsocketClientService
  ) {
    websocketClient.messageReceived.subscribe((m: WebsocketMessage) => {
      this.handleReceivedMessage(m);
    }, e => {
      console.error(e);
      this.notificationService.addError(this.translationService.instant('project.live-updates-init-error'));
    });
  }

  private handleReceivedMessage(m: WebsocketMessage): void {
    switch (m.type) {
      case WebsocketMessageType.MessageType_ProjectAdded:
        this.getProject(m.id).subscribe({
          next: p => {
            this.projectAdded.emit(p);
          },
          error: e => {
            console.error('Unable to process ' + m.type + ' event for project ' + m.id);
            console.error(e);
          }
        });
        break;
      case WebsocketMessageType.MessageType_ProjectUpdated:
        this.getProject(m.id).subscribe({
          next: p => {
            // Also call the task service to send task-updates to the components.
            this.taskService.updateTasks(p.tasks);
            this.projectChanged.emit(p);
          },
          error: e => {
            console.error('Unable to process ' + m.type + ' event for project ' + m.id);
            console.error(e);
          }
        });
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

  /**
   * Creates a new project on the server with empty tasks.
   */
  public createNewProject(
    name: string,
    maxProcessPoints: number,
    projectDescription: string,
    features: Feature<Geometry>[],
    users: string[],
    owner: string,
    josmDataSource: JosmDataSource
  ): Observable<Project> {
    const format = new GeoJSON();
    // We want features to attach attributes and to not be bound to one single Polygon.
    // Furthermore the escaping in the string breaks the format as the "\" character is actually transmitted as "\" character
    const geometries: string[] = [];
    for (const feature of features) {
      geometries.push(format.writeFeature(feature));
    }

    const p = new ProjectAddDto(
      new ProjectDraftDto(name, projectDescription, users, owner, josmDataSource),
      geometries.map(g => new TaskDraftDto(maxProcessPoints, 0, g))
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

  public update(projectId: string, newName: string, newDescription: string, newJosmDataSource: JosmDataSource): Observable<Project> {
    const dto = new ProjectUpdateDto(newName, newDescription, newJosmDataSource);
    return this.http.put<ProjectDto>(environment.url_projects_update.replace('{id}', projectId), JSON.stringify(dto))
      .pipe(
        mergeMap(projectDto => this.toProject(projectDto)),
        tap(p => this.projectChanged.emit(p))
      );
  }

  public addComment(projectId: string, comment: string): Observable<Project> {
    const dto = new CommentDraftDto(comment);
    return this.http.post<ProjectDto>(environment.url_projects_comments.replace('{id}', projectId), JSON.stringify(dto))
      .pipe(
        mergeMap(projectDto => this.toProject(projectDto)),
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

  importProject(projectExport: ProjectExport): Observable<any> {
    return this.http.post(environment.url_projects_import, JSON.stringify(projectExport));
  }

  // Gets user names and turns the DTOs into Projects
  public toProjects(dtos: ProjectDto[]): Observable<Project[]> {
    if (!dtos || dtos.length === 0) {
      return of([]);
    }

    const projectUserIDs = dtos.map(p => [p.owner, ...p.users]); // array of arrays
    const commentUserIDs = [
      ...dtos.flatMap(p => p.comments.map(c => c.authorId)),
      ...dtos.map(p => p.tasks.flatMap(t => t.comments.map(c => c.authorId))),
    ];
    let userIDs = ([] as string[]).concat(...projectUserIDs, ...commentUserIDs)
      .filter(id => !!id);
    userIDs = [...new Set(userIDs)]; // Remove duplicates

    return this.userService.getUsersByIds(userIDs)
      .pipe(
        map((allUsers: User[]) => {
          const projects: Observable<Project>[] = [];

          for (const p of dtos) {
            const userMap = new Map(allUsers.map(obj => [obj.uid, obj]));

            projects.push(this.toProjectWithTasks(p, userMap));
          }

          return projects;
        }),
        // Turn Observable<Observable<Project>[]> into Observable<Project[]>
        mergeMap((a: Observable<Project>[]) => forkJoin(a))
      );
  }

  // Takes the given project dto, the owner, users, gets the tasks from the server and build an Project object
  private toProjectWithTasks(p: ProjectDto, userMap: Map<string, User>): Observable<Project> {
    return of(new Project(
      p.id,
      p.name,
      p.description,
      p.tasks.map(dto => this.taskService.toTaskWithUsers(dto, userMap)),
      p.users.map(u => {
        let rawUser = userMap.get(u);
        if (!rawUser) {
          return new User('???', u, false);
        }
        return rawUser as User;
      }),
      userMap.get(p.owner) as User,
      p.needsAssignment,
      p.creationDate,
      this.commentService.toCommentsWithUserMap(p.comments, userMap),
      p.josmDataSource,
      p.totalProcessPoints ?? 0,
      p.doneProcessPoints ?? 0
    ));
  }
}
