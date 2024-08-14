import { ProjectListComponent } from './project-list.component';
import { CurrentUserService } from '../../user/current-user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, TestTaskFeature } from '../../task/task.material';
import { User } from '../../user/user.material';
import { Project } from '../project.material';
import { ProjectService } from '../project.service';
import { of } from 'rxjs';
import { NotificationService } from '../../common/services/notification.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { EventEmitter } from '@angular/core';
import { AppModule } from '../../app.module';
import { TranslateService } from '@ngx-translate/core';

describe(ProjectListComponent.name, () => {
  let component: ProjectListComponent;
  let fixture: MockedComponentFixture<ProjectListComponent>;
  let router: Router;
  let currentUserService: CurrentUserService;
  let projectService: ProjectService;
  let notificationService: NotificationService;
  let translationService: TranslateService;

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    projectService = {
      projectAdded: new EventEmitter<Project>(),
      projectChanged: new EventEmitter<Project>(),
      projectDeleted: new EventEmitter<string>(),
      projectUserRemoved: new EventEmitter<string>(),
    } as ProjectService;
    router = {} as Router;
    notificationService = {} as NotificationService;
    translationService = {} as TranslateService;

    const activatedRoute = {snapshot: {data: {projects: []}}} as unknown as ActivatedRoute;

    return MockBuilder(ProjectListComponent, AppModule)
      .provide({provide: ProjectService, useFactory: () => projectService})
      .provide({provide: Router, useFactory: () => router})
      .provide({provide: ActivatedRoute, useFactory: () => activatedRoute})
      .provide({provide: CurrentUserService, useFactory: () => currentUserService})
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(ProjectListComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate on click', () => {
    router.navigate = jest.fn();

    component.onProjectListItemClicked('123');

    expect(router.navigate).toHaveBeenCalled();
  });

  it('should get current user correctly', () => {
    currentUserService.getUserId = jest.fn().mockReturnValue('12345');

    expect(component.currentUserId).toEqual('12345');
  });

  it('should add new project to list', () => {
    component.projects = [createProject()];

    const p = createProject();
    p.id = '123456';
    p.name = 'flubby';
    projectService.getProject = jest.fn().mockReturnValue(of(p));

    // Trigger all needed events
    projectService.projectAdded.next(p);

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
    projectService.getProject = jest.fn().mockReturnValue(of(p));

    // Trigger all needed events
    projectService.projectChanged.next(p);

    expect(component.projects.length).toEqual(1);
    expect(component.projects[0].users).toEqual(p.users);
  });

  it('should add unknown updated project to list', () => {
    component.projects = [];

    const p = createProject();
    projectService.getProject = jest.fn().mockReturnValue(of(p));

    // Trigger all needed events
    projectService.projectChanged.next(p);

    expect(component.projects).toContain(p);
  });

  it('should update project in list', () => {
    component.projects = [createProject()];

    const p = createProject();
    p.name = 'flubby';
    projectService.getProject = jest.fn().mockReturnValue(of(p));

    // Trigger all needed events
    projectService.projectChanged.next(p);

    expect(component.projects[0]).toEqual(p);
  });

  it('should remove project from list', () => {
    notificationService.addInfo = jest.fn();
    translationService.instant = jest.fn();

    const p = createProject();
    component.projects = [p];

    // Trigger all needed events
    projectService.projectDeleted.next(p.id);

    expect(component.projects.length).toEqual(0);
    expect(notificationService.addInfo).toHaveBeenCalled();
  });

  it('should do nothing on remove event of unknown project', () => {
    notificationService.addInfo = jest.fn();

    const p = createProject();
    component.projects = [p];

    // Trigger all needed events
    projectService.projectDeleted.next('283745237654');

    expect(component.projects).toEqual([p]);
    expect(notificationService.addInfo).not.toHaveBeenCalled();
  });

  it('should update projects on user-remove event', () => {
    notificationService.addInfo = jest.fn();
    translationService.instant = jest.fn();

    const p = createProject();
    const p2 = createProject();
    p2.id = '35345'; // some other ID
    component.projects = [p, p2];

    // Trigger all needed events
    projectService.projectUserRemoved.next(p2.id);

    expect(component.projects).toEqual([p]);
    expect(notificationService.addInfo).toHaveBeenCalled();
  });

  it('should do nothing on user-remove event of unknown project', () => {
    notificationService.addInfo = jest.fn();

    const p = createProject();
    component.projects = [p];

    // Trigger all needed events
    projectService.projectUserRemoved.next('283745237654');

    expect(component.projects).toEqual([p]);
    expect(notificationService.addInfo).not.toHaveBeenCalled();
  });

  function createProject(): Project {
    const t = new Task('567', '', 10, 100, TestTaskFeature, []);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1, true, new Date(), [], 'OSM', 0, 0);
  }
});
