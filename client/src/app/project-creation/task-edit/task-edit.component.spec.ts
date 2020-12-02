import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskEditComponent } from './task-edit.component';
import { TaskDraftService } from '../task-draft.service';
import { TaskDraft } from '../../task/task.material';
import { Polygon } from 'ol/geom';

describe('TaskEditComponent', () => {
  let component: TaskEditComponent;
  let fixture: ComponentFixture<TaskEditComponent>;
  let taskDraftService: TaskDraftService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskEditComponent],
      providers: [TaskDraftService],
    })
      .compileComponents();

    taskDraftService = TestBed.inject(TaskDraftService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call rename function on service', () => {
    const spy = spyOn(taskDraftService, 'changeTaskName');

    component.task = new TaskDraft('123', 'some name', new Polygon([]));
    component.onTaskNameChanged('new name');

    expect(spy).toHaveBeenCalledWith('123', 'new name');
  });
});
