import { TestBed } from '@angular/core/testing';

import { ProjectService } from './project.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from '../task/task.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Task, TaskDto, TestTaskFeature, TestTaskGeometry } from '../task/task.material';
import { UserService } from '../user/user.service';
import { User } from '../user/user.material';
import { Project, ProjectDto } from './project.material';
import GeoJSON from 'ol/format/GeoJSON';

describe('ProjectService', () => {
  let service: ProjectService;
  let taskService: TaskService;
  let userService: UserService;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProjectService);
    taskService = TestBed.inject(TaskService);
    userService = TestBed.inject(UserService);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create tasks when creating project', () => {
    const tasks = [
      new Task('1', 'name1', 0, 100, TestTaskFeature),
      new Task('2', 'name2', 0, 100, TestTaskFeature),
      // @ts-ignore
      new Task('3', undefined, 0, 100, TestTaskFeature)
    ];

    spyOn(taskService, 'createNewTasks').and.callFake((geom: string[], maxProcessPoints: number) => {
      return of(tasks);
    });

    const format = new GeoJSON();

    service.createNewProject('project name', 100, 'lorem ipsum',
      [
        format.readFeature(TestTaskGeometry),
        format.readFeature(TestTaskGeometry),
        format.readFeature(TestTaskGeometry)
      ], ['user'], 'user')
      .subscribe(p => {
        // Only these properties can be checked. All others (like 'owner') are set by the server, which we don't use here
        expect(p.id).toEqual('');
        expect(p.name).toEqual('project name');
        expect(p.tasks).toEqual(tasks);
      }, err => {
        console.error(err);
        fail();
      });
  });

  it('should add users when getting all projects', () => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    const dto1 = new ProjectDto('123', 'Project 123', 'foo', ['1'], [taskDtos[0]], '1', false, date);
    const dto2 = new ProjectDto('124', 'Project 124', 'bar', ['2'], [taskDtos[1]], '2', false, date);
    spyOn(httpClient, 'get').and.returnValue(of([dto1, dto2]));

    service.getProjects().subscribe((projects: Project[]) => {
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
    }, e => fail(e));
  });

  it('should add users when getting a specific project', () => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '3'], [taskDtos[0]], '1', false, date);
    spyOn(httpClient, 'get').and.returnValue(of(dto));

    service.getProject('123').subscribe((project: Project) => {
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
    }, e => fail(e));
  });

  it('should return project after invitation', () => {
    const {users, taskDtos} = setUpUserAndTasks();
    const date = new Date();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2'], [taskDtos[0]], '2', true, date);
    spyOn(httpClient, 'post').and.returnValue(of(dto));
  });

  it('should remove user correctly and return updated project', () => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2'], taskDtos, '2', true, date);
    spyOn(httpClient, 'delete').and.returnValue(of(dto));
    const changeSpy = spyOn(service.projectChanged, 'emit');

    service.removeUser('123', '3').subscribe((project: Project) => {
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
    }, e => fail(e));
  });

  function taskDtoToTask(tasks: TaskDto[]): Task[] {
    return tasks.map(t => taskService.toTask(t));
  }

  it('should convert DTOs into Projects', () => {
    const {users, taskDtos} = setUpUserAndTasks();
    const tasks = taskDtoToTask(taskDtos);
    const date = new Date();

    const dto: ProjectDto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2', '3'], taskDtos, '2', true, date);

    // Execute
    service.toProject(dto).subscribe((project: Project) => {
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

      expect(project.users).toContain(users[0]);
      expect(project.users).toContain(users[1]);
      expect(project.users).toContain(users[2]);

      expect(project.creationDate).toEqual(date);
    }, e => fail(e));
  });

  it('should return no project for no dto', () => {
    service.toProjects([]).subscribe((projects: Project[]) => {
      expect(projects).toBeTruthy();
      expect(projects.length).toEqual(0);
    }, e => {
      console.error(e);
      fail(e);
    });
  });

  function setUpUserAndTasks(): { users: User[], taskDtos: TaskDto[] } {
    const users = [
      new User('test user 1', '1'),
      new User('test user 2', '2'),
      new User('test user 3', '3'),
    ];
    spyOn(userService, 'getUsersByIds').and.callFake((ids: string[]) => {
      return of(users.filter(u => ids.includes(u.uid)));
    });

    const taskDtos = [
      new TaskDto('7', 0, 100, TestTaskGeometry, '2', 'bar'),
      new TaskDto('8', 10, 100, TestTaskGeometry, '1', 'foo'),
      new TaskDto('9', 100, 100, TestTaskGeometry)
    ];

    return {users, taskDtos};
  }
});
