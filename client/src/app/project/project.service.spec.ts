import { ProjectService } from './project.service';
import { TaskService } from '../task/task.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Task, TaskDto, TestTaskGeometry } from '../task/task.material';
import { UserService } from '../user/user.service';
import { User } from '../user/user.material';
import { Project, ProjectDto } from './project.material';
import GeoJSON from 'ol/format/GeoJSON';
import { WebsocketClientService } from '../common/services/websocket-client.service';
import { NotificationService } from '../common/services/notification.service';
import { EventEmitter } from '@angular/core';
import { WebsocketMessage } from '../common/entities/websocket-message';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { TranslateService } from '@ngx-translate/core';

describe(ProjectService.name, () => {
  let service: ProjectService;
  let taskService: TaskService;
  let userService: UserService;
  let httpClient: HttpClient;
  let websocketClient: WebsocketClientService;
  let notificationService: NotificationService;
  let translationService: TranslateService;

  beforeEach(() => {
    taskService = {} as TaskService;
    userService = {} as UserService;
    httpClient = {} as HttpClient;
    websocketClient = {
      messageReceived: new EventEmitter<WebsocketMessage>(),
    } as WebsocketClientService;
    notificationService = {} as NotificationService;
    translationService = {} as TranslateService;

    service = new ProjectService(taskService, userService, httpClient, websocketClient, notificationService, translationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create tasks when creating project', done => {
    // Arrange
    const taskDtos = [
      new TaskDto('1', 0, 100, TestTaskGeometry, '1'),
      new TaskDto('2', 0, 100, TestTaskGeometry, '2'),
      new TaskDto('3', 0, 100, TestTaskGeometry)
    ];
    const tasks = taskDtoToTask(taskDtos);
    const format = new GeoJSON();
    const projectDto = new ProjectDto('124', 'Project 124', 'bar', ['2'], taskDtos, '2', false, new Date());

    httpClient.post = jest.fn().mockReturnValue(of(projectDto));
    userService.getUsersByIds = jest.fn().mockReturnValue(of([new User('U1', '1'), new User('U2', '2')]));
    taskService.toTaskWithUsers = jest.fn().mockImplementation((dto: TaskDto, users: User[]) => taskDtoToTask([dto])[0]);
    taskService.createNewTasks = jest.fn().mockImplementation((geom: string[], maxProcessPoints: number) => {
      return of(tasks);
    });

    // Act & Assert
    service.createNewProject('project name', 100, 'lorem ipsum',
      [
        format.readFeature(TestTaskGeometry),
        format.readFeature(TestTaskGeometry),
        format.readFeature(TestTaskGeometry)
      ], ['user'], 'user')
      .subscribe({
        next: p => {
          // Only these properties can be checked. All others (like 'owner') are set by the server, which we don't use here
          expect(p.id).toEqual(projectDto.id);
          expect(p.name).toEqual(projectDto.name);
          expect(p.tasks.length).toEqual(tasks.length);
          expect(p.tasks.map(t => t.id)).toContain(tasks[0].id);
          expect(p.tasks.map(t => t.id)).toContain(tasks[1].id);
          expect(p.tasks.map(t => t.id)).toContain(tasks[2].id);
          done();
        },
        error: e => {
          console.error(e);
        }
      });
  });

  it('should add users when getting all projects', done => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    taskService.toTaskWithUsers = jest.fn().mockImplementation((dto: TaskDto, _: User[]) => taskDtoToTask([dto])[0]);

    const dto1 = new ProjectDto('123', 'Project 123', 'foo', ['1'], [taskDtos[0]], '1', false, date);
    const dto2 = new ProjectDto('124', 'Project 124', 'bar', ['2'], [taskDtos[1]], '2', false, date);
    httpClient.get = jest.fn().mockReturnValue(of([dto1, dto2]));

    service.getProjects().subscribe({
      next: (projects: Project[]) => {
        expect(projects).toBeTruthy();
        expect(projects.length).toEqual(2);

        expect(projects[0].users.length).toEqual(1);
        expect(projects[0].users[0]).toEqual(users[0]);
        expect(projects[0].tasks.length).toEqual(1);
        expect(projects[0].tasks[0].id).toEqual(tasks[0].id);

        expect(projects[1].users.length).toEqual(1);
        expect(projects[1].users[0]).toEqual(users[1]);
        expect(projects[1].tasks.length).toEqual(1);
        expect(projects[1].tasks[0].id).toEqual(tasks[1].id);

        expect(projects[0].creationDate).toEqual(date);
        expect(projects[1].creationDate).toEqual(date);

        done();
      },
      error: e => fail(e)
    });
  });

  it('should add users when getting a specific project', done => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    taskService.toTaskWithUsers = jest.fn().mockImplementation((d: TaskDto, _: User[]) => taskDtoToTask([d])[0]);

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '3'], [taskDtos[0]], '1', false, date);
    httpClient.get = jest.fn().mockReturnValue(of(dto));

    service.getProject('123').subscribe({
      next: (project: Project) => {
        expect(project).toBeTruthy();
        expect(project.id).toEqual(dto.id);
        expect(project.name).toEqual(dto.name);
        expect(project.description).toEqual(dto.description);

        expect(project.owner.uid).toEqual(dto.owner);
        expect(project.owner.name).toEqual('test user 1');

        expect(project.tasks.map(t => t.id)).toContain(tasks[0].id);

        expect(project.users).toContain(users[0]);
        expect(project.users).toContain(users[2]);

        expect(project.creationDate).toEqual(date);

        done();
      },
      error: e => fail(e)
    });
  });

  it('should return project after invitation', () => {
    const {users, taskDtos} = setUpUserAndTasks();
    const date = new Date();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2'], [taskDtos[0]], '2', true, date);
    httpClient.get = jest.fn().mockReturnValue(of(dto));

    // TODO finish test
  });

  it('should remove user correctly and return updated project', done => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();
    const changeSpy = jest.fn();

    taskService.toTaskWithUsers = jest.fn().mockImplementation((d: TaskDto, _: User[]) => taskDtoToTask([d])[0]);

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2'], taskDtos, '2', true, date);
    httpClient.delete = jest.fn().mockReturnValue(of(dto));
    service.projectChanged.subscribe(changeSpy);

    service.removeUser('123', '3').subscribe({
      next: (project: Project) => {
        // Check
        expect(project).toBeTruthy();

        expect(project.owner.uid).toEqual('2');
        expect(project.owner.name).toEqual('test user 2');

        expect(project.tasks.map(t => t.id)).toContain(tasks[0].id);
        expect(project.tasks.map(t => t.id)).toContain(tasks[1].id);
        expect(project.tasks.map(t => t.id)).toContain(tasks[2].id);

        expect(project.users).toContain(users[0]);
        expect(project.users).toContain(users[1]);
        expect(project.users).not.toContain(users[2]);

        expect(project.creationDate).toEqual(date);

        expect(changeSpy).toHaveBeenCalled();

        done();
      },
      error: e => fail(e)
    });
  });

  it('should convert DTOs into Projects', done => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    userService.getUsersByIds = jest.fn().mockImplementation((ids: string[]) => of(users.filter(u => ids.includes(u.uid))));
    taskService.toTaskWithUsers = jest.fn().mockImplementation((d: TaskDto, _: User[]) => taskDtoToTask([d])[0]);

    const dto: ProjectDto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2', '3'], taskDtos, '2', true, date);

    // Execute
    service.toProject(dto).subscribe({
      next: (project: Project) => {
        // Check
        expect(project).toBeTruthy();
        expect(project.id).toEqual(dto.id);
        expect(project.name).toEqual(dto.name);
        expect(project.description).toEqual(dto.description);

        expect(project.owner.uid).toEqual(dto.owner);
        expect(project.owner.name).toEqual('test user 2');

        expect(project.tasks.map(t => t.id)).toContain(tasks[0].id);
        expect(project.tasks.map(t => t.id)).toContain(tasks[1].id);
        expect(project.tasks.map(t => t.id)).toContain(tasks[2].id);

        expect(project.tasks.find(t => t.id === tasks[0].id)?.assignedUser?.name).toEqual(users[0].name);
        expect(project.tasks.find(t => t.id === tasks[1].id)?.assignedUser?.name).toEqual(users[1].name);
        expect(project.tasks.find(t => t.id === tasks[2].id)?.assignedUser).toBeUndefined();

        expect(project.users).toContain(users[0]);
        expect(project.users).toContain(users[1]);
        expect(project.users).toContain(users[2]);

        expect(project.creationDate).toEqual(date);

        done();
      },
      error: e => fail(e)
    });
  });

  it('should return no project for no dto', done => {
    service.toProjects([]).subscribe({
      next: (projects: Project[]) => {
        expect(projects).toBeTruthy();
        expect(projects.length).toEqual(0);
        done();
      },
      error: e => {
        console.error(e);
        fail(e);
      }
    });
  });

  function taskDtoToTask(tasks: TaskDto[]): Task[] {
    return tasks.map(dto => {
      // TODO This is a re-implementation of the TaskService.toTask function. Extract this into own utility class?
      const feature = (new GeoJSON().readFeature(dto.geometry) as Feature<Geometry>);

      const assignedUser = dto.assignedUser && dto.assignedUserName ? new User(dto.assignedUserName, dto.assignedUser) : undefined;

      return new Task(
        dto.id,
        feature.get('name'),
        dto.processPoints,
        dto.maxProcessPoints,
        feature,
        assignedUser
      );
    });
  }

  function setUpUserAndTasks(): { users: User[], taskDtos: TaskDto[] } {
    const users = [
      new User('test user 1', '1'),
      new User('test user 2', '2'),
      new User('test user 3', '3'),
    ];
    userService.getUsersByIds = jest.fn().mockImplementation((ids: string[]) => {
      return of(users.filter(u => ids.includes(u.uid)));
    });

    const taskDtos = [
      new TaskDto('7', 0, 100, TestTaskGeometry, users[0].uid, users[0].name),
      new TaskDto('8', 10, 100, TestTaskGeometry, users[1].uid, users[1].name),
      new TaskDto('9', 100, 100, TestTaskGeometry)
    ];

    return {users, taskDtos};
  }
});
