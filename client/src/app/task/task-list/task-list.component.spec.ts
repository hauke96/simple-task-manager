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

  it('should select correct task', () => {
    const selectSpy = spyOn(taskService, 'selectTask').and.callThrough();
    const eventSpy = spyOn(taskService.selectedTaskChanged, 'emit').and.callThrough();

    const tasks: Task[] = [];
    tasks.push(new Task('42', undefined, 10, 100, TestTaskFeature));
    tasks.push(new Task('43', undefined, 55, 100, TestTaskFeature));
    component.tasks = tasks;

    component.onListItemClicked('42');

    expect(selectSpy).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    expect(component.selectedTaskId).toEqual('42');
  });

  it('should update tasks on tasksUpdated event', () => {
    const tasks: Task[] = [];
    tasks.push(new Task('1', undefined, 10, 100, TestTaskFeature));
    tasks.push(new Task('2', undefined, 30, 100, TestTaskFeature));
    tasks.push(new Task('3', undefined, 60, 100, TestTaskFeature));
    tasks.push(new Task('4', undefined, 99, 100, TestTaskFeature));
    component.tasks = tasks;

    // Empty update
    taskService.tasksUpdated.emit([]);
    expect(component.tasks).toEqual(tasks);

    // Update without listed tasks
    taskService.tasksUpdated.emit([new Task('1546', undefined, 100, 100, TestTaskFeature)]);
    expect(component.tasks).toEqual(tasks);

    // Actually update some tasks
    const t1 = new Task('1', undefined, 100, 100, TestTaskFeature);
    const t4 = new Task('4', undefined, 50, 100, TestTaskFeature, new User('bar', '123'));
    taskService.tasksUpdated.emit([t1, t4]);

    expect(component.tasks[0]).toEqual(t1);
    expect(component.tasks[3]).toEqual(t4);
  });

  it('should determine correctly whether user is assigned', () => {
    currentUserService.setUser('Mr. Answer', '42');

    expect(component.isAssignedToCurrentUser(new Task('1', undefined, 10, 100, TestTaskFeature))).toEqual(false);
    expect(component.isAssignedToCurrentUser(new Task('2', undefined, 10, 100, TestTaskFeature,
      new User('foo', '1')))).toEqual(false);
    expect(component.isAssignedToCurrentUser(new Task('3', undefined, 10, 100, TestTaskFeature,
      new User('Mr. Answer', '42')))).toEqual(true);
  });
});
