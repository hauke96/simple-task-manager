import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskListComponent } from './task-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Task, TestTaskGeometry } from '../task.material';
import { TaskService } from '../task.service';
import { CurrentUserService } from '../../user/current-user.service';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;

  beforeEach(async(() => {
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
    tasks.push(new Task('42', 10, 100, TestTaskGeometry));
    tasks.push(new Task('43', 55, 100, TestTaskGeometry));
    component.tasks = tasks;

    component.onListItemClicked('42');

    expect(selectSpy).toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalled();
    expect(component.selectedTaskId).toEqual('42');
  });

  it('should update tasks on tasksUpdated event', () => {
    const tasks: Task[] = [];
    tasks.push(new Task('1', 10, 100, TestTaskGeometry));
    tasks.push(new Task('2', 30, 100, TestTaskGeometry));
    tasks.push(new Task('3', 60, 100, TestTaskGeometry));
    tasks.push(new Task('4', 99, 100, TestTaskGeometry));
    component.tasks = tasks;

    // Empty update
    taskService.tasksUpdated.emit([]);
    expect(component.tasks).toEqual(tasks);

    // Update without listed tasks
    taskService.tasksUpdated.emit([new Task('1546', 100, 100, TestTaskGeometry)]);
    expect(component.tasks).toEqual(tasks);

    // Actually update some tasks
    const t1 = new Task('1', 100, 100, TestTaskGeometry);
    const t4 = new Task('4', 50, 100, TestTaskGeometry, '123');
    taskService.tasksUpdated.emit([t1, t4]);

    expect(component.tasks[0]).toEqual(t1);
    expect(component.tasks[3]).toEqual(t4);
  });

  it('should determine correctly whether user is assigned', () => {
    currentUserService.setUser('Mr. Answer', '42');

    expect(component.isAssignedToCurrentUser(new Task('1', 10, 100, TestTaskGeometry))).toEqual(false);
    expect(component.isAssignedToCurrentUser(new Task('2', 10, 100, TestTaskGeometry, '1'))).toEqual(false);
    expect(component.isAssignedToCurrentUser(new Task('3', 10, 100, TestTaskGeometry, '42'))).toEqual(true);
  });
});
