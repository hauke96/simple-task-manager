import { TestBed } from '@angular/core/testing';

import { ProjectService } from './project.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from '../task/task.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Task, TestTaskFeature, TestTaskGeometry } from '../task/task.material';
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
    const {users, tasks} = setUpUserAndTasks();

    const dto1 = new ProjectDto('123', 'Project 123', 'foo', ['1'], [tasks[0]], '1', false);
    const dto2 = new ProjectDto('124', 'Project 124', 'bar', ['2'], [tasks[1]], '2', false);
    spyOn(httpClient, 'get').and.returnValue(of([dto1, dto2]));

    service.getProjects().subscribe((projects: Project[]) => {
      expect(projects).toBeTruthy();
      expect(projects.length).toEqual(2);

      expect(projects[0].users.length).toEqual(1);
      expect(projects[0].users[0]).toEqual(users[0]);
      expect(projects[0].tasks.length).toEqual(1);
      expect(projects[0].tasks[0]).toEqual(tasks[0]);

      expect(projects[1].users.length).toEqual(1);
      expect(projects[1].users[0]).toEqual(users[1]);
      expect(projects[1].tasks.length).toEqual(1);
      expect(projects[1].tasks[0]).toEqual(tasks[1]);
    }, e => fail(e));
  });

  it('should add users when getting a specific project', () => {
    const {users, tasks} = setUpUserAndTasks();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '3'], [tasks[0]], '1', false);
    spyOn(httpClient, 'get').and.returnValue(of(dto));

    service.getProject('123').subscribe((project: Project) => {
      expect(project).toBeTruthy();
      expect(project.id).toEqual(dto.id);
      expect(project.name).toEqual(dto.name);
      expect(project.description).toEqual(dto.description);

      expect(project.owner.uid).toEqual(dto.owner);
      expect(project.owner.name).toEqual('test user 1');

      expect(project.tasks).toContain(tasks[0]);

      expect(project.users).toContain(users[0]);
      expect(project.users).toContain(users[2]);
    }, e => fail(e));
  });

  it('should return project after invitation', () => {
    const {users, tasks} = setUpUserAndTasks();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2'], [tasks[0]], '2', true);
    spyOn(httpClient, 'post').and.returnValue(of(dto));
  });

  it('should return tasks with user names', () => {
    const {users, tasks} = setUpUserAndTasks();

    // The result isn't important (s. TaskService tests) but we just want to check that this is called
    const addUserNamesSpy = spyOn(taskService, 'addUserNames').and.returnValue(of([]));

    spyOn(httpClient, 'get').and.returnValue(of(tasks));

    service.getTasks('123').subscribe((newTasks: Task[]) => {
      expect(addUserNamesSpy).toHaveBeenCalled();
    }, e => fail(e));
  });

  it('should remove user correctly and return updated project', () => {
    const {users, tasks} = setUpUserAndTasks();

    const dto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2'], tasks, '2', true);
    spyOn(httpClient, 'delete').and.returnValue(of(dto));
    const changeSpy = spyOn(service.projectChanged, 'emit');

    service.removeUser('123', '3').subscribe((project: Project) => {
      // Check
      expect(project).toBeTruthy();

      expect(project.owner.uid).toEqual('2');
      expect(project.owner.name).toEqual('test user 2');

      expect(project.tasks).toContain(tasks[0]);
      expect(project.tasks).toContain(tasks[1]);
      expect(project.tasks).toContain(tasks[2]);

      expect(project.users).toContain(users[0]);
      expect(project.users).toContain(users[1]);
      expect(project.users).not.toContain(users[2]);

      expect(changeSpy).toHaveBeenCalled();
    }, e => fail(e));
  });

  it('should convert DTOs into Projects', () => {
    const {users, tasks} = setUpUserAndTasks();

    const dto: ProjectDto = new ProjectDto('123', 'Project 123', 'foo', ['1', '2', '3'], tasks, '2', true);

    // Execute
    service.toProject(dto).subscribe((project: Project) => {
      // Check
      expect(project).toBeTruthy();
      expect(project.id).toEqual(dto.id);
      expect(project.name).toEqual(dto.name);
      expect(project.description).toEqual(dto.description);

      expect(project.owner.uid).toEqual(dto.owner);
      expect(project.owner.name).toEqual('test user 2');

      expect(project.tasks).toContain(tasks[0]);
      expect(project.tasks).toContain(tasks[1]);
      expect(project.tasks).toContain(tasks[2]);

      expect(project.users).toContain(users[0]);
      expect(project.users).toContain(users[1]);
      expect(project.users).toContain(users[2]);
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

  function setUpUserAndTasks(): { users: User[], tasks: Task[] } {
    const users = [
      new User('test user 1', '1'),
      new User('test user 2', '2'),
      new User('test user 3', '3'),
    ];
    spyOn(userService, 'getUsersByIds').and.callFake((ids: string[]) => {
      return of(users.filter(u => ids.includes(u.uid)));
    });

    const tasks = [
      new Task('7', undefined, 0, 100, TestTaskFeature, new User('bar', '2')),
      new Task('8', undefined, 0, 100, TestTaskFeature, new User('foo', '1')),
      new Task('9', undefined, 0, 100, TestTaskFeature)
    ];

    return {users, tasks};
  }
});
