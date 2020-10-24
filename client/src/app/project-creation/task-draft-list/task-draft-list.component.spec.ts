import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDraftListComponent } from './task-draft-list.component';
import { TaskDraft } from '../../task/task.material';

describe('TaskDraftListComponent', () => {
  let component: TaskDraftListComponent;
  let fixture: ComponentFixture<TaskDraftListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskDraftListComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDraftListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
