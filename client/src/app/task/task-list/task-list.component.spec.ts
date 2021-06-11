import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TaskListComponent } from './task-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Task, TestTaskFeature } from '../task.material';
import { TaskService } from '../task.service';
import { CurrentUserService } from '../../user/current-user.service';
import { User } from '../../user/user.material';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TaskListComponent],
      imports: [HttpClientTestingModule],
    })
      .compileComponents();

    taskService = TestBed.inject(TaskService);
    currentUserService = TestBed.inject(CurrentUserService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort tasks', () => {
    const tasks: Task[] = [];
    tasks.push(new Task('1', 'a', 10, 100, TestTaskFeature));
    tasks.push(new Task('2', 'b', 100, 100, TestTaskFeature));
    tasks.push(new Task('3', 'z', 60, 100, TestTaskFeature));
    tasks.push(new Task('4', 'a', 100, 100, TestTaskFeature));
    tasks.push(new Task('5', 'g', 30, 100, TestTaskFeature));
    component.tasks = [...tasks];

    // Actually update some tasks
    expect(component.tasks[0]).toEqual(tasks[0]);
    expect(component.tasks[1]).toEqual(tasks[4]);
    expect(component.tasks[2]).toEqual(tasks[2]);
    expect(component.tasks[3]).toEqual(tasks[3]);
    expect(component.tasks[4]).toEqual(tasks[1]);
  });

  it('should select correct task', () => {
    const selectSpy = spyOn(taskService, 'selectTask').and.callThrough();
    const eventSpy = spyOn(taskService.selectedTaskChanged, 'emit').and.callThrough();

    const tasks: Task[] = [];
    tasks.push(new Task('42', '', 10, 100, TestTaskFeature));
    tasks.push(new Task('43', '', 55, 100, TestTaskFeature));
    component.tasks = [...tasks];

    component.onListItemClicked('42');

    expect(selectSpy).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    expect(component.selectedTaskId).toEqual('42');
  });

  describe('update event', () => {
    let tasks: Task[];

    beforeEach(() => {
      tasks = [];

      tasks.push(new Task('1', '1', 10, 100, TestTaskFeature));
      tasks.push(new Task('2', '2', 30, 100, TestTaskFeature));
      tasks.push(new Task('3', '3', 60, 100, TestTaskFeature));
      tasks.push(new Task('4', '4', 99, 100, TestTaskFeature));

      component.tasks = [...tasks];
    });

    it('should ignore empty event', () => {
      taskService.tasksUpdated.emit([]);
      expect(component.tasks).toContain(tasks[0]);
      expect(component.tasks).toContain(tasks[1]);
      expect(component.tasks).toContain(tasks[2]);
      expect(component.tasks).toContain(tasks[3]);
    });

    it('should ignore event with other tasks', () => {
      taskService.tasksUpdated.emit([new Task('1546', '', 100, 100, TestTaskFeature)]);
      expect(component.tasks).toContain(tasks[0]);
      expect(component.tasks).toContain(tasks[1]);
      expect(component.tasks).toContain(tasks[2]);
      expect(component.tasks).toContain(tasks[3]);
    });

    it('should correctly update', () => {
      const t1 = new Task('1', '1', 100, 100, TestTaskFeature);
      const t4 = new Task('4', '4', 50, 100, TestTaskFeature, new User('bar', '123'));
      taskService.tasksUpdated.emit([t1, t4]);

      expect(component.tasks[0].id).toEqual(t1.id);
      expect(component.tasks[0].processPoints).toEqual(100);
      expect(component.tasks[3].id).toEqual(t4.id);
      expect(component.tasks[3].processPoints).toEqual(50);
      expect(component.tasks[3].assignedUser).not.toBeFalse();
      expect(component.tasks[3].assignedUser?.name).toEqual('bar');
      expect(component.tasks[3].assignedUser?.uid).toEqual('123');
    });
  });

  it('should determine correctly whether user is assigned', () => {
    currentUserService.setUser('Mr. Answer', '42');

    expect(component.isAssignedToCurrentUser(new Task('1', '', 10, 100, TestTaskFeature))).toEqual(false);
    expect(component.isAssignedToCurrentUser(new Task('2', '', 10, 100, TestTaskFeature,
      new User('foo', '1')))).toEqual(false);
    expect(component.isAssignedToCurrentUser(new Task('3', '', 10, 100, TestTaskFeature,
      new User('Mr. Answer', '42')))).toEqual(true);
  });
});
