import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CurrentUserService } from '../../user/current-user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MockRouter } from '../../common/mock-router';
import { Task, TestTaskFeature } from '../../task/task.material';
import { User } from '../../user/user.material';
import { Project } from '../project.material';
import { WebsocketClientService } from '../../common/websocket-client.service';
import { WebsocketMessage, WebsocketMessageType } from '../../common/websocket-message';
import { ProjectService } from '../project.service';
import { of } from 'rxjs';
import { NotificationService } from '../../common/notification.service';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let routerMock: MockRouter;
  let currentUserService: CurrentUserService;
  let projectService: ProjectService;
  let notificationService: NotificationService;
  let websocketService: WebsocketClientService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        CurrentUserService,
        {
          provide: Router,
          useClass: MockRouter
        },
        {
          provide: ActivatedRoute,
          useValue: {snapshot: {data: {projects: []}}}
        }
      ]
    })
      .compileComponents();

    routerMock = TestBed.inject(Router);
    currentUserService = TestBed.inject(CurrentUserService);
    projectService = TestBed.inject(ProjectService);
    notificationService = TestBed.inject(NotificationService);
    websocketService = TestBed.inject(WebsocketClientService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate on click', () => {
    const spy = spyOn(routerMock, 'navigate');

    component.onProjectListItemClicked('123');

    expect(spy).toHaveBeenCalled();
  });

  it('should get current user correctly', () => {
    spyOn(currentUserService, 'getUserId').and.returnValue('12345');

    expect(component.currentUserId).toEqual('12345');
  });

  it('should add new project to list', () => {
    component.projects = [createProject()];

    const p = createProject();
    p.id = '123456';
    p.name = 'flubby';
    spyOn(projectService, 'getProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectAdded,
      p.id
    ));

    expect(component.projects).toContain(p);
  });

  it('should update project', () => {
    component.projects = [createProject()];

    const p = createProject();
    p.id = component.projects[0].id;
    p.owner = component.projects[0].owner;
    p.tasks = component.projects[0].tasks;
    p.name = component.projects[0].name;
    p.users = component.projects[0].users;
    p.users.push(new User('Foo', '1234'));
    spyOn(projectService, 'getProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      p.id
    ));

    expect(component.projects.length).toEqual(1);
    expect(component.projects[0].users).toEqual(p.users);
  });

  it('should add unknown updated project to list', () => {
    component.projects = [];

    const p = createProject();
    spyOn(projectService, 'getProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      p.id
    ));

    expect(component.projects).toContain(p);
  });

  it('should update project in list', () => {
    component.projects = [createProject()];

    const p = createProject();
    p.name = 'flubby';
    spyOn(projectService, 'getProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      p.id
    ));

    expect(component.projects[0]).toEqual(p);
  });

  it('should remove project from list', () => {
    const spyNotification = spyOn(notificationService, 'addInfo');

    const p = createProject();
    component.projects = [p];

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectDeleted,
      p.id
    ));

    expect(component.projects.length).toEqual(0);
    expect(spyNotification).toHaveBeenCalled();
  });

  it('should do nothing on remove event of unknown project', () => {
    const spyNotification = spyOn(notificationService, 'addInfo');

    const p = createProject();
    component.projects = [p];

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectDeleted,
      '283745237654'
    ));

    expect(component.projects).toEqual([p]);
    expect(spyNotification).not.toHaveBeenCalled();
  });

  it('should update projects on user-remove event', () => {
    const spyNotification = spyOn(notificationService, 'addInfo');

    const p = createProject();
    const p2 = createProject();
    p2.id = '35345'; // some other ID
    component.projects = [p, p2];

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUserRemoved,
      p2.id
    ));

    expect(component.projects).toEqual([p]);
    expect(spyNotification).toHaveBeenCalled();
  });

  it('should do nothing on user-remove event of unknown project', () => {
    const spyNotification = spyOn(notificationService, 'addInfo');

    const p = createProject();
    component.projects = [p];

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUserRemoved,
      '283745237654'
    ));

    expect(component.projects).toEqual([p]);
    expect(spyNotification).not.toHaveBeenCalled();
  });

  function createProject(): Project {
    const t = new Task('567', undefined, 10, 100, TestTaskFeature);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1, true, new Date());
  }
});
