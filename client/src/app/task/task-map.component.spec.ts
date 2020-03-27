import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskMapComponent } from './task-map.component';

describe('TaskMapComponent', () => {
  let component: TaskMapComponent;
  let fixture: ComponentFixture<TaskMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
