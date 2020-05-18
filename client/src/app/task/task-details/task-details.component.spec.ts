import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsComponent } from './task-details.component';
import { CurrentUserService } from '../../user/current-user.service';
import { TaskService } from '../task.service';
import { Task } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('TaskDetailsComponent', () => {
  let component: TaskDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;
  let task: Task;
  const testUserId = '123';

  beforeEach(async(() => {
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

    task = new Task('t-42', 10, 100, [[0, 0], [1, 1], [1, 0], [0, 0]]);

    taskService = TestBed.inject(TaskService);
    spyOn(taskService, 'assign').and.callFake((id: string, user: string) => {
      task.assignedUser = user;
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });
    spyOn(taskService, 'unassign').and.callFake((id: string) => {
      task.assignedUser = '';
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });
    spyOn(taskService, 'setProcessPoints').and.callFake((id: string, points: number) => {
      task.processPoints = points;
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });

    currentUserService = TestBed.inject(CurrentUserService);
    spyOn(currentUserService, 'getUserId').and.returnValue(testUserId);
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
    component.task = task;
    component.onAssignButtonClicked();

    fixture.detectChanges();
    expect(component.task.assignedUser).toEqual(testUserId);
  });
  it('should unassign and update task', () => {
    task.assignedUser = testUserId;

    component.task = task;
    component.onUnassignButtonClicked();

    fixture.detectChanges();
    expect(component.task.assignedUser).toEqual('');
  });
  it('should set process points', () => {
    component.task = task;
    component.newProcessPoints = 50;
    component.onSaveButtonClick();

    fixture.detectChanges();
    expect(component.task.processPoints).toEqual(50);
  });
});
