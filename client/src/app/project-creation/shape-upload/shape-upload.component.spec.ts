import { ShapeUploadComponent } from './shape-upload.component';
import { NotificationService } from '../../common/services/notification.service';
import { TaskDraftService } from '../task-draft.service';
import { GeometryService } from '../../common/services/geometry.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { throwError } from 'rxjs';
import { Polygon } from 'ol/geom';
import { TaskDraft } from '../../task/task.material';
import { AppModule } from '../../app.module';
import { TranslateService } from '@ngx-translate/core';

describe(ShapeUploadComponent.name, () => {
  let component: ShapeUploadComponent;
  let fixture: MockedComponentFixture<ShapeUploadComponent>;
  let notificationService: NotificationService;
  let taskDraftService: TaskDraftService;
  let geometryService: GeometryService;
  let translationService: TranslateService;

  beforeEach(() => {
    notificationService = {} as NotificationService;
    taskDraftService = {} as TaskDraftService;
    geometryService = {} as GeometryService;
    translationService = {} as TranslateService;

    return MockBuilder(ShapeUploadComponent, AppModule)
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: TaskDraftService, useFactory: () => taskDraftService})
      .provide({provide: GeometryService, useFactory: () => geometryService})
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(ShapeUploadComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on added tasks', () => {
    const geometry = new Polygon([[[0, 0], [2, 0], [1, 1], [0, 0]]]);
    geometryService.parseData = jest.fn().mockReturnValue([geometry]);
    taskDraftService.addTasks = jest.fn();
    taskDraftService.toTaskDraft = jest.fn().mockReturnValue(new TaskDraft('1', 'one', geometry, 10));

    // @ts-ignore
    component.addTasks({target: {result: exampleGeoJson}});

    expect(taskDraftService.addTasks).toHaveBeenCalled();
  });

  it('should show notification on invalid geometry', () => {
    notificationService.addError = jest.fn();

    // @ts-ignore
    component.addTasks({target: {result: '[]'}});

    expect(notificationService.addError).toHaveBeenCalled();
  });

  it('should show notification on error', () => {
    notificationService.addError = jest.fn();
    geometryService.parseData = jest.fn().mockReturnValue(throwError(() => 'test error'));

    // @ts-ignore
    component.addTasks({target: {result: '[]'}});

    expect(geometryService.parseData).toHaveBeenCalled();
  });
});

const exampleGeoJson = `
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": {
      "name": "EPSG:3857"
    }
  },
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [0, 0]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [[4e6, -2e6], [8e6, 2e6]]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [[4e6, 2e6], [8e6, -2e6]]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[-5e6, -1e6], [-4e6, 1e6], [-3e6, -1e6]]]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "MultiLineString",
      "coordinates": [
        [[-1e6, -7.5e5], [-2e6, 0], [-1e6, 7.5e5], [-1e6, -7.5e5]],
        [[1e6, -7.5e5], [1e6, 7.5e5]],
        [[-7.5e5, -1e6], [7.5e5, -1e6]],
        [[-7.5e5, 1e6], [7.5e5, 1e6]]
      ]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "MultiPolygon",
      "coordinates": [
        [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6], [-3e6, 6e6]]],
        [[[-2e6, 6e6], [-2e6, 8e6], [0, 8e6], [0, 6e6]]],
        [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6], [3e6, 6e6]]]
      ]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "LineString",
        "coordinates": [[-5e6, -5e6], [-10e6, 0], [-5e6, 5e6], [-5e6, -5e6]]
      }, {
        "type": "Point",
        "coordinates": [4e6, -5e6]
      }, {
        "type": "Polygon",
        "coordinates": [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
      }]
    }
  }]
}`;
