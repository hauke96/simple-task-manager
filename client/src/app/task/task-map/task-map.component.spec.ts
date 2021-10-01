import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TaskMapComponent } from './task-map.component';
import { Task } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaskService } from '../task.service';
import { Feature } from 'ol';
import { CurrentUserService } from '../../user/current-user.service';
import { Polygon } from 'ol/geom';
import { User } from '../../user/user.material';

describe('TaskMapComponent', () => {
  let component: TaskMapComponent;
  let fixture: ComponentFixture<TaskMapComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;

  beforeEach(waitForAsync(() => {
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
      new Task('1', '', 0, 100, getFeature()),
      new Task('2', '', 10, 100, getFeature()),
      new Task('3', '', 50, 100, getFeature()),
      new Task('4', '', 100, 100, getFeature()),
    ];

    component.ngAfterViewInit();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the task on change', () => {
    const task = component.tasks[2];

    taskService.selectTask(task);

    // @ts-ignore
    expect(component.task).toEqual(task);
  });

  it('should create fillColor correctly', () => {
    checkStyle(0, '#e6000050', 1);
    checkStyle(1, '#e22d0050', 1);
    checkStyle(2, '#d2d20050', 1);
    checkStyle(3, '#00be0050', 1);
  });

  it('should create selected color correctly', () => {
    checkStyle(0, '#e6000050', 4, true);
    checkStyle(1, '#e22d0050', 4, true);
    checkStyle(2, '#d2d20050', 4, true);
    checkStyle(3, '#00be0050', 4, true);
  });

  it('should create assigned color correctly', () => {
    spyOn(currentUserService, 'getUserId').and.returnValue('123');
    component.tasks.forEach(t => t.assignedUser = new User('foo-' + t.id, '123'));

    checkStyle(0, '#e6000090', 4, true);
    checkStyle(1, '#e22d0090', 1);
    checkStyle(2, '#d2d20090', 4, true);
    checkStyle(3, '#00be0090', 1);
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

  function getFeature(): Feature<Polygon> {
    return new Feature(new Polygon([[[0, 0], [1, 1], [1, 2]]]));
  }
});
