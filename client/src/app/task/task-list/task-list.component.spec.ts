import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskListComponent } from './task-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Task, TestTaskGeometry } from '../task.material';
import { TaskService } from '../task.service';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskService: TaskService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TaskListComponent],
      imports: [HttpClientTestingModule],
    })
      .compileComponents();

    taskService = TestBed.inject(TaskService);
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
});
