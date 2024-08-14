import { ProjectComponent } from './project.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, TestTaskFeature } from '../../task/task.material';
import { User } from '../../user/user.material';
import { Project } from '../project.material';
import { of, throwError } from 'rxjs';
import { WebsocketMessage } from '../../common/entities/websocket-message';
import { ProjectService } from '../project.service';
import { WebsocketClientService } from '../../common/services/websocket-client.service';
import { NotificationService } from '../../common/services/notification.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { EventEmitter } from '@angular/core';

describe(ProjectComponent.name, () => {
  let component: ProjectComponent;
  let fixture: MockedComponentFixture<ProjectComponent>;
  let projectService: ProjectService;
  let websocketService: WebsocketClientService;
  let router: Router;
  let notificationService: NotificationService;

  beforeEach(() => {
    projectService = {
      projectAdded: new EventEmitter<Project>(),
      projectChanged: new EventEmitter<Project>(),
      projectDeleted: new EventEmitter<string>(),
      projectUserRemoved: new EventEmitter<string>(),
    } as ProjectService;
    router = {} as Router;
    websocketService = {
      messageReceived: new EventEmitter<WebsocketMessage>(),
    } as WebsocketClientService;
    notificationService = {} as NotificationService;
    const activatedRoute = {snapshot: {data: {project: createProject()}}} as unknown as ActivatedRoute;

    return MockBuilder(ProjectComponent, AppModule)
      .provide({provide: ProjectService, useFactory: () => projectService})
      .provide({provide: Router, useFactory: () => router})
      .provide({provide: ActivatedRoute, useFactory: () => activatedRoute})
      .provide({provide: WebsocketClientService, useFactory: () => websocketService})
      .provide({provide: NotificationService, useFactory: () => notificationService});
  });

  beforeEach(() => {
    fixture = MockRender(ProjectComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update project on update', () => {
    // Arrange
    component.project = createProject();

    const p = createProject();
    p.name = 'flubby';
    projectService.getProject = jest.fn().mockReturnValue(of(p));

    // Act
    projectService.projectChanged.next(p);

    // Assert
    expect(component.project).toEqual(p);
  });

  it('should navigate on deleted project', () => {
    // Arrange
    router.navigate = jest.fn();
    component.project = createProject();
    notificationService.addInfo = jest.fn();

    // Act
    projectService.projectDeleted.next(component.project.id);

    // Assert
    expect(notificationService.addInfo).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should do nothing on foreign deleted project', () => {
    // Arrange
    router.navigate = jest.fn();
    component.project = createProject();

    // Act
    projectService.projectDeleted.next('flubby dubby');

    // Assert
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show error message on error during user removal', () => {
    router.navigate = jest.fn();
    projectService.removeUser = jest.fn().mockReturnValue(throwError(() => new Error('test error')));
    notificationService.addError = jest.fn();

    component.project = createProject();
    component.onUserRemoved('123');

    expect(projectService.removeUser).toHaveBeenCalledWith('1', '123');
    expect(notificationService.addError).toHaveBeenCalled();
  });

  it('should show error message on error inviting user', () => {
    projectService.inviteUser = jest.fn().mockReturnValue(throwError(() => new Error('test error')));
    notificationService.addError = jest.fn();

    component.onUserInvited(new User('foo bar', '222'));

    expect(projectService.inviteUser).toHaveBeenCalledWith('1', '222');
    expect(notificationService.addError).toHaveBeenCalled();
  });

  function createProject(): Project {
    const t = new Task('567', '', 10, 100, TestTaskFeature, []);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1, true, new Date(), [], 'OSM', 0, 0);
  }
});
