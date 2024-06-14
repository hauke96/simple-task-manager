import { TaskMapComponent } from './task-map.component';
import { Task } from '../task.material';
import { TaskService } from '../task.service';
import { Feature } from 'ol';
import { CurrentUserService } from '../../user/current-user.service';
import { Polygon } from 'ol/geom';
import { User } from '../../user/user.material';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { EventEmitter } from '@angular/core';
import { MapLayerService } from '../../common/services/map-layer.service';
import { ProcessPointColorService } from '../../common/services/process-point-color.service';
import { TranslateService } from '@ngx-translate/core';

describe(TaskMapComponent.name, () => {
  let component: TaskMapComponent;
  let fixture: MockedComponentFixture<TaskMapComponent, any>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;
  let processPointColorService: ProcessPointColorService;
  let layerService: MapLayerService;
  let translationService: TranslateService;

  beforeEach(() => {
    taskService = {} as TaskService;
    taskService.selectedTaskChanged = new EventEmitter();
    taskService.getSelectedTask = jest.fn().mockReturnValue(undefined);
    translationService = {} as TranslateService;

    currentUserService = {} as CurrentUserService;
    processPointColorService = {} as ProcessPointColorService;
    layerService = {} as MapLayerService;
    layerService.fitView = jest.fn();
    layerService.addLayer = jest.fn();
    layerService.removeLayer = jest.fn();

    return MockBuilder(TaskMapComponent, AppModule)
      .provide({provide: TaskService, useFactory: () => taskService})
      .provide({provide: CurrentUserService, useFactory: () => currentUserService})
      .provide({provide: ProcessPointColorService, useFactory: () => processPointColorService})
      .provide({provide: MapLayerService, useFactory: () => layerService})
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(TaskMapComponent, {
      tasks: [
        new Task('1', '', 0, 100, getFeature(), []),
        new Task('2', '', 10, 100, getFeature(), []),
        new Task('3', '', 50, 100, getFeature(), []),
        new Task('4', '', 100, 100, getFeature(), []),
      ]
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add layer', () => {
    expect(layerService.addLayer).toHaveBeenCalled();
  });

  it('should call fitView', () => {
    expect(layerService.fitView).toHaveBeenCalledTimes(1);
  });

  it('should update the task on change', () => {
    // Arrange
    const task = component.tasks[2];

    // Act
    taskService.selectedTaskChanged.next(task);

    // Assert
    expect(component.selectedTask).toEqual(task);
  });

  describe('with color service', () => {
    let processPointsColorFn: jest.Mock;

    beforeEach(() => {
      processPointsColorFn = jest.fn();
      processPointColorService.getProcessPointsColor = processPointsColorFn;
      translationService.instant = jest.fn();
    });

    it('should create fillColor correctly', () => {
      processPointsColorFn.mockReturnValue('#e60000');
      checkStyle(0, '#e6000050', 1);

      processPointsColorFn.mockReturnValue('#e22d00');
      checkStyle(1, '#e22d0050', 1);

      processPointsColorFn.mockReturnValue('#d2d200');
      checkStyle(2, '#d2d20050', 1);

      processPointsColorFn.mockReturnValue('#00be00');
      checkStyle(3, '#00be0050', 1);
    });

    it('should create selected color correctly', () => {
      processPointsColorFn.mockReturnValue('#e60000');
      checkStyle(0, '#e6000050', 4, true);

      processPointsColorFn.mockReturnValue('#e22d00');
      checkStyle(1, '#e22d0050', 4, true);

      processPointsColorFn.mockReturnValue('#d2d200');
      checkStyle(2, '#d2d20050', 4, true);

      processPointsColorFn.mockReturnValue('#00be00');
      checkStyle(3, '#00be0050', 4, true);
    });

    it('should create assigned color correctly', () => {
      currentUserService.getUserId = jest.fn().mockReturnValue('123');
      component.tasks.forEach(t => t.assignedUser = new User('foo-' + t.id, '123'));

      processPointsColorFn.mockReturnValue('#e60000');
      checkStyle(0, '#e6000090', 4, true);

      processPointsColorFn.mockReturnValue('#e22d00');
      checkStyle(1, '#e22d0090', 1);

      processPointsColorFn.mockReturnValue('#d2d200');
      checkStyle(2, '#d2d20090', 4, true);

      processPointsColorFn.mockReturnValue('#00be00');
      checkStyle(3, '#00be0090', 1);
    });
  });

  function checkStyle(taskIndex: number, expectedColor: string, expectedBorderWidth: number, select: boolean = false): void {
    if (select) {
      component.selectedTask = component.tasks[taskIndex];
    }
    const f = new Feature({task_id: component.tasks[taskIndex].id});
    const s = component.getStyle(f);
    expect(s.getFill()?.getColor()).toEqual(expectedColor);
    expect(s.getStroke()?.getColor()).toEqual('#009688');
    expect(s.getStroke()?.getWidth()).toEqual(expectedBorderWidth);
  }

  function getFeature(): Feature<Polygon> {
    return new Feature(new Polygon([[[0, 0], [1, 1], [1, 2]]]));
  }
});
