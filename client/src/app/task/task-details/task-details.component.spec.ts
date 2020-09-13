import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TaskDetailsComponent } from './task-details.component';
import { CurrentUserService } from '../../user/current-user.service';
import { TaskService } from '../task.service';
import { Task, TestTaskFeature } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { WebsocketClientService } from '../../common/websocket-client.service';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.material';

describe('TaskDetailsComponent', () => {
  let component: TaskDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;
  let websocketService: WebsocketClientService;
  let userService: UserService;
  const testUserId = '123';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TaskDetailsComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        CurrentUserService,
        TaskService,
      ]
    })
      .compileComponents();

    taskService = TestBed.inject(TaskService);
    spyOn(taskService, 'assign').and.callFake((id: string) => {
      const task = createTask(10, id);
      task.assignedUser = new User('Foo', testUserId);
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });
    spyOn(taskService, 'unassign').and.callFake((id: string) => {
      const task = createTask(10, id);
      task.assignedUser = undefined;
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });
    spyOn(taskService, 'setProcessPoints').and.callFake((id: string, points: number) => {
      const task = createTask(points, id);
      task.processPoints = points;
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });

    currentUserService = TestBed.inject(CurrentUserService);
    spyOn(currentUserService, 'getUserId').and.returnValue(testUserId);

    userService = TestBed.inject(UserService);
    spyOn(userService, 'getUsersByIds').and.returnValue(of([new User('Foo', testUserId)]));

    websocketService = TestBed.inject(WebsocketClientService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign and update task', () => {
    component.task = createTask(10);
    component.onAssignButtonClicked();

    fixture.detectChanges();
    expect(component.task.assignedUser.uid).toEqual(testUserId);
  });

  it('should unassign and update task', () => {
    component.task = createTask(10);
    component.task.assignedUser = new User('Foo', testUserId);
    component.onUnassignButtonClicked();

    fixture.detectChanges();
    expect(component.task.assignedUser).toEqual(undefined);
  });

  it('should set process points', () => {
    component.task = createTask(10);
    component.newProcessPoints = 50;
    component.onSaveButtonClick();

    fixture.detectChanges();
    expect(component.task.processPoints).toEqual(50);
  });

  it('should set all process points on done-button', () => {
    component.task = createTask(10, '123');
    component.newProcessPoints = 50;
    component.onDoneButtonClick();

    fixture.detectChanges();
    expect(component.task.processPoints).toEqual(component.task.maxProcessPoints);
  });

  it('should update tasks on updated project', () => {
    const t: Task = createTask(10);
    const newProcessPoints = 50;

    taskService.selectTask(t);
    component.task = t;

    // Update task, this would normally happen via websocket events.
    taskService.updateTasks([createTask(newProcessPoints)]);

    expect(component.task.processPoints).toEqual(newProcessPoints);
  });

  function createTask(processPoints: number, id: string = '123'): Task {
    return new Task(id, undefined, processPoints, 789, TestTaskFeature);
  }
});
