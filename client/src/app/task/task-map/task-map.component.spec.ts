import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskMapComponent } from './task-map.component';
import { Task } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from '../task.service';
import { Feature } from 'ol';
import { CurrentUserService } from '../../user/current-user.service';
import { Polygon } from 'ol/geom';

describe('TaskMapComponent', () => {
  let component: TaskMapComponent;
  let fixture: ComponentFixture<TaskMapComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TaskMapComponent],
      imports: [HttpClientTestingModule],
    })
      .compileComponents();

    taskService = TestBed.inject(TaskService);
    currentUserService = TestBed.inject(CurrentUserService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskMapComponent);
    component = fixture.componentInstance;

    component.tasks = [
      new Task('1', undefined, 0, 100, getFeature()),
      new Task('2', undefined, 10, 100, getFeature()),
      new Task('3', undefined, 50, 100, getFeature()),
      new Task('4', undefined, 100, 100, getFeature()),
    ];

    component.ngAfterViewInit();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the task on change', () => {
    const task = new Task('id123', undefined, 10, 100, getFeature(), 'miriam');

    taskService.selectTask(task);

    // @ts-ignore
    expect(component.task).toEqual(task);
  });

  it('should create fillColor correctly', () => {
    checkStyle(0, '#ff000040', 1);
    checkStyle(1, '#ff330040', 1);
    checkStyle(2, '#ffff0040', 1);
    checkStyle(3, '#00ff0040', 1);
  });

  it('should create selected color correctly', () => {
    checkStyle(0, '#ff000080', 1, true);
    checkStyle(1, '#ff330080', 1, true);
    checkStyle(2, '#ffff0080', 1, true);
    checkStyle(3, '#00ff0080', 1, true);
  });

  it('should create assigned color correctly', () => {
    spyOn(currentUserService, 'getUserId').and.returnValue('123');
    component.tasks.forEach(t => t.assignedUser = '123');

    checkStyle(0, '#ff000080', 4, true);
    checkStyle(1, '#ff330040', 4);
    checkStyle(2, '#ffff0080', 4, true);
    checkStyle(3, '#00ff0040', 4);
  });

  function checkStyle(taskIndex: number, expectedColor: string, expectedBorderWidth: number, select: boolean = false) {
    if (select) {
      component.task = component.tasks[taskIndex];
    }
    const f = new Feature({task_id: component.tasks[taskIndex].id});
    const s = component.getStyle(f);
    expect(s.getFill().getColor()).toEqual(expectedColor);
    expect(s.getStroke().getColor()).toEqual('#009688');
    expect(s.getStroke().getWidth()).toEqual(expectedBorderWidth);
  }

  function getFeature(): Feature {
    return new Feature(new Polygon([[[0, 0], [1, 1], [1, 2]]]));
  }
});
