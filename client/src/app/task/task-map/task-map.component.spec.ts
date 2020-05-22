import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskMapComponent } from './task-map.component';
import { Task, TestTaskGeometry } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from '../task.service';

describe('TaskMapComponent', () => {
  let component: TaskMapComponent;
  let fixture: ComponentFixture<TaskMapComponent>;
  let taskService: TaskService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TaskMapComponent],
      imports: [HttpClientTestingModule],
    })
      .compileComponents();

    taskService = TestBed.inject(TaskService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskMapComponent);
    component = fixture.componentInstance;

    component.tasks = [
      new Task('t-0', 0, 100, TestTaskGeometry),
      new Task('t-1', 0, 100, TestTaskGeometry)
    ];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the task on change', () => {
    const task = new Task('id123', 10, 100, TestTaskGeometry, 'miriam');

    taskService.selectTask(task);

    // @ts-ignore
    expect(component.task).toEqual(task);
  });
});
