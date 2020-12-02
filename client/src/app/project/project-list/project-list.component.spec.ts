import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CurrentUserService } from '../../user/current-user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MockRouter } from '../../common/mock-router';
import { Task, TestTaskFeature } from '../../task/task.material';
import { User } from '../../user/user.material';
import { Project, ProjectDto } from '../project.material';
import { WebsocketClientService } from '../../common/websocket-client.service';
import { WebsocketMessage, WebsocketMessageType } from '../../common/websocket-message';
import { ProjectService } from '../project.service';
import { of } from 'rxjs';
import { ProcessPointColorService } from '../../common/process-point-color.service';
import { NotificationService } from '../../common/notification.service';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let routerMock: MockRouter;
  let currentUserService: CurrentUserService;
  let projectService: ProjectService;
  let colorService: ProcessPointColorService;
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
    colorService = TestBed.inject(ProcessPointColorService);
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
    spyOn(projectService, 'toProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectAdded,
      new ProjectDto(p.id, p.name, p.description, p.users.map(u => u.uid), p.owner.uid, p.needsAssignment)
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
    spyOn(projectService, 'toProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      new ProjectDto(p.id, p.name, p.description, p.users.map(u => u.uid), p.owner.uid, p.needsAssignment)
    ));

    expect(component.projects.length).toEqual(1);
    expect(component.projects[0].users).toEqual(p.users);
  });

  it('should add unknown updated project to list', () => {
    component.projects = [];

    const p = createProject();
    spyOn(projectService, 'toProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      new ProjectDto(p.id, p.name, p.description, p.users.map(u => u.uid), p.owner.uid, p.needsAssignment)
    ));

    expect(component.projects).toContain(p);
  });

  it('should update project in list', () => {
    component.projects = [createProject()];

    const p = createProject();
    p.name = 'flubby';
    spyOn(projectService, 'toProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      new ProjectDto(p.id, p.name, p.description, p.users.map(u => u.uid), p.owner.uid, p.needsAssignment)
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

  it('should calculate percentage correctly', () => {
    const p = createProject();
    p.totalProcessPoints = 300;
    p.doneProcessPoints = 196; // -> 65.33333%
    expect(component.getProcessPointPercentage(p)).toEqual(65);

    p.totalProcessPoints = 200;
    p.doneProcessPoints = 1; // -> 0.5%
    expect(component.getProcessPointPercentage(p)).toEqual(1);

    p.totalProcessPoints = 200;
    p.doneProcessPoints = 42; // -> 21.0%
    expect(component.getProcessPointPercentage(p)).toEqual(21);
  });

  it('should call color service for point color', () => {
    const spy = spyOn(colorService, 'getProcessPointsColor');

    component.getProcessPointColor({doneProcessPoints: 10, totalProcessPoints: 100} as Project);

    expect(spy).toHaveBeenCalledWith(10, 100);
  });

  it('should get correct process point width', () => {
    expect(component.getProcessPointWidth({doneProcessPoints: 0, totalProcessPoints: 100} as Project)).toEqual('0px');
    expect(component.getProcessPointWidth({doneProcessPoints: 33, totalProcessPoints: 100} as Project)).toEqual('33px');
    // normal rounding would result in 67px but we want the floor-rounding:
    expect(component.getProcessPointWidth({doneProcessPoints: 66, totalProcessPoints: 100} as Project)).toEqual('66px');
    expect(component.getProcessPointWidth({doneProcessPoints: 100, totalProcessPoints: 100} as Project)).toEqual('100px');
  });

  function createProject(): Project {
    const t = new Task('567', undefined, 10, 100, TestTaskFeature);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }
});
