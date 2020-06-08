import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectComponent } from './project.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, TestTaskGeometry } from '../../task/task.material';
import { User } from '../../user/user.material';
import { Project, ProjectDto } from '../project.material';
import { of } from 'rxjs';
import { WebsocketMessage, WebsocketMessageType } from '../../common/websocket-message';
import { ProjectService } from '../project.service';
import { WebsocketClientService } from '../../common/websocket-client.service';
import { MockRouter } from '../../common/mock-router';

describe('ProjectComponent', () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  let projectService: ProjectService;
  let websocketService: WebsocketClientService;
  let routerMock: MockRouter;

  beforeEach(async(() => {
    const task = new Task('567', 10, 100, TestTaskGeometry);

    TestBed.configureTestingModule({
      declarations: [ProjectComponent],
      imports: [
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {snapshot: {data: {project: createProject()}}}
        },
        {
          provide: Router,
          useClass: MockRouter
        },
      ]
    })
      .compileComponents();

    projectService = TestBed.inject(ProjectService);
    routerMock = TestBed.inject(Router);
    websocketService = TestBed.inject(WebsocketClientService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update project on update', () => {
    component.project = createProject();

    const p = createProject();
    p.name = 'flubby';
    spyOn(projectService, 'toProject').and.returnValue(of(p));

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      new ProjectDto(p.id, p.name, p.description, p.tasks.map(t => t.id), p.users.map(u => u.uid), p.owner.uid, p.needsAssignment)
    ));

    expect(component.project).toEqual(p);
  });

  it('should navigate on deleted project', () => {
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    component.project = createProject();

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectDeleted,
      component.project.id
    ));

    expect(spyRouter).toHaveBeenCalledWith(['/manager']);
  });

  it('should do nothing on foreign deleted project', () => {
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    component.project = createProject();

    // Trigger all needed events
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectDeleted,
      'flubby dubby'
    ));

    expect(spyRouter).not.toHaveBeenCalled();
  });

  function createProject() {
    const t = new Task('567', 10, 100, TestTaskGeometry);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }
});
