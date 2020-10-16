import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDraftListComponent } from './task-draft-list.component';
import { Feature } from 'ol';

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

  it('should create task data correctly', () => {
    component.features = [
      new Feature({id: '123', name: 'foo'}),
      new Feature({id: '234'}),
    ];

    expect(component.taskDrafts[0].id).toEqual('123');
    expect(component.taskDrafts[0].name).toEqual('foo');
    expect(component.taskDrafts[1].id).toEqual('234');
    expect(component.taskDrafts[1].name).toEqual('234');
  });
});
