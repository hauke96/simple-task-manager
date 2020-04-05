import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskMapComponent } from './task-map.component';
import { Task } from './task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TaskMapComponent', () => {
  let component: TaskMapComponent;
  let fixture: ComponentFixture<TaskMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskMapComponent ],
      imports: [ HttpClientTestingModule ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskMapComponent);
    component = fixture.componentInstance;

    component.tasks = [
     new Task('t-0', 0, 100, [[0,0],[1,1],[1,0],[0,0]]),
     new Task('t-1', 0, 100, [[0,0],[1,1],[1,0],[0,0]])
    ]

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
