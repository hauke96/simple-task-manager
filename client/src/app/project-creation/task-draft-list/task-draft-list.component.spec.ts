import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDraftListComponent } from './task-draft-list.component';
import { TaskDraftService } from '../task-draft.service';

describe('TaskDraftListComponent', () => {
  let component: TaskDraftListComponent;
  let fixture: ComponentFixture<TaskDraftListComponent>;
  let taskDraftService: TaskDraftService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDraftListComponent],
      providers: [TaskDraftService]
    })
      .compileComponents();

    taskDraftService = TestBed.inject(TaskDraftService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDraftListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select task on service', () => {
    const spy = spyOn(taskDraftService, 'selectTask');

    component.onTaskClicked('123');

    expect(spy).toHaveBeenCalledWith('123');
  });
});
