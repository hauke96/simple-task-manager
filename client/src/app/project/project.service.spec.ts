import { TestBed } from '@angular/core/testing';

import { ProjectService } from './project.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from '../task/task.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Task } from '../task/task.material';
import { User } from '../user/user.material';
import { Project } from './project.material';

describe('ProjectService', () => {
  let service: ProjectService;
  let taskService: TaskService;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProjectService);
    taskService = TestBed.inject(TaskService);
    httpClient = TestBed.inject(HttpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create tasks when creating project', () => {
    const geometries: [number, number][][] = [
      [[0, 0], [1, 1], [2, 0], [0, 0]],
      [[0, 0], [1, 1], [2, 0], [3, 4], [0, 0]],
      [[10, 0], [11, 1], [12, 0], [10, 0]]
    ];

    const tasks = [
      new Task('1', 0, 100, geometries[0]),
      new Task('2', 0, 100, geometries[1]),
      new Task('3', 0, 100, geometries[2])
    ];

    spyOn(taskService, 'createNewTasks').and.callFake((geom: [number, number][][], maxProcessPoints: number) => {
      return of(tasks);
    });

    service.createNewProject('project name', 100, 'lorem ipsum', geometries, ['user'], 'user')
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
});
