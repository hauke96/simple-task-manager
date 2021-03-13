import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShapeUploadComponent } from './shape-upload.component';
import { NotificationService } from '../../common/notification.service';
import { TaskDraftService } from '../task-draft.service';
import { GeometryService } from '../../common/geometry.service';
import { ProjectImportService } from '../project-import.service';

describe('ShapeUploadComponent', () => {
  let component: ShapeUploadComponent;
  let fixture: ComponentFixture<ShapeUploadComponent>;
  let notificationService: NotificationService;
  let taskDraftService: TaskDraftService;
  let geometryService: GeometryService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ShapeUploadComponent]
    })
      .compileComponents();

    notificationService = TestBed.inject(NotificationService);
    taskDraftService = TestBed.inject(TaskDraftService);
    geometryService = TestBed.inject(GeometryService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on added tasks', () => {
    const spy = spyOn(taskDraftService, 'addTasks');

    component.addTasks({target: {result: exampleGeoJson}});

    expect(spy).toHaveBeenCalled();
  });

  it('should show notification on invalid geometry', () => {
    const spy = spyOn(notificationService, 'addError');

    component.addTasks({target: {result: '[]'}});

    expect(spy).toHaveBeenCalled();
  });

  it('should show notification on error', () => {
    const spy = spyOn(notificationService, 'addError');
    spyOn(geometryService, 'parseData').and.throwError('test error');

    component.addTasks({target: {result: '[]'}});

    expect(spy).toHaveBeenCalled();
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
