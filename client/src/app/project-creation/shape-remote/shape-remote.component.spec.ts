import { ShapeRemoteComponent } from './shape-remote.component';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Polygon } from 'ol/geom';
import { NotificationService } from '../../common/services/notification.service';
import { GeometryService } from '../../common/services/geometry.service';
import { LoadingService } from '../../common/services/loading.service';
import { TaskDraftService } from '../task-draft.service';
import { TaskDraft } from '../../task/task.material';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppComponent } from '../../app.component';
import { TranslateService } from '@ngx-translate/core';
import { AppModule } from '../../app.module';

const remoteGeometry = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="Overpass API 0.7.56.3 eb200aeb">
  <node id="1" lat="0" lon="0"/>
  <node id="2" lat="0" lon="2"/>
  <node id="3" lat="1" lon="1"/>
  <way id="4">
    <nd ref="1"/>
    <nd ref="2"/>
    <nd ref="3"/>
    <nd ref="1"/>
    <tag k="name" v="Creepy Forest"/>
  </way>
</osm>
`;

describe(ShapeRemoteComponent.name, () => {
  let component: ShapeRemoteComponent;
  let fixture: MockedComponentFixture<ShapeRemoteComponent>;
  let httpClient: HttpClient;
  let notificationService: NotificationService;
  let geometryService: GeometryService;
  let loadingService: LoadingService;
  let taskDraftService: TaskDraftService;
  let translateService: TranslateService;

  beforeEach(() => {
    httpClient = {} as HttpClient;
    notificationService = {} as NotificationService;
    geometryService = {} as GeometryService;
    loadingService = {} as LoadingService;
    loadingService.start = jest.fn();
    loadingService.end = jest.fn();
    taskDraftService = {} as TaskDraftService;
    translateService = {} as TranslateService;

    return MockBuilder(ShapeRemoteComponent, AppModule)
      .provide({provide: HttpClient, useFactory: () => httpClient})
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: GeometryService, useFactory: () => geometryService})
      .provide({provide: LoadingService, useFactory: () => loadingService})
      .provide({provide: TaskDraftService, useFactory: () => taskDraftService})
      .provide({provide: TranslateService, useFactory: () => translateService});
  });

  beforeEach(() => {
    fixture = MockRender(ShapeRemoteComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading spinner on load', () => {
    httpClient.get = jest.fn().mockReturnValue(of(remoteGeometry));
    component.onLoadButtonClicked();
    expect(loadingService.start).toHaveBeenCalled();
    expect(loadingService.end).toHaveBeenCalled();
  });

  it('should emit feature after load', () => {
    const expectedCoordinates = [[[0, 0], [2, 0], [1, 1], [0, 0]]];
    const geometry = new Polygon(expectedCoordinates);

    httpClient.get = jest.fn().mockReturnValue(of(remoteGeometry));
    geometryService.parseData = jest.fn().mockReturnValue([geometry]);
    taskDraftService.addTasks = jest.fn().mockImplementation((t: TaskDraft[]) => {
      expect(t.length).toEqual(1);
      expect((t[0].geometry as Polygon).getCoordinates()).toEqual(expectedCoordinates);
    });
    taskDraftService.toTaskDraft = jest.fn().mockReturnValue(new TaskDraft('1', 'one', geometry, 10));

    component.onLoadButtonClicked();

    expect(taskDraftService.addTasks).toHaveBeenCalled();
  });

  it('should notify but not emit on parsing error', () => {
    httpClient.get = jest.fn().mockReturnValue(of(remoteGeometry));
    geometryService.parseData = jest.fn().mockReturnValue([]);
    translateService.instant = jest.fn();

    notificationService.addError = jest.fn();
    taskDraftService.addTasks = jest.fn();

    component.onLoadButtonClicked();

    expect(notificationService.addError).toHaveBeenCalled();
    expect(taskDraftService.addTasks).not.toHaveBeenCalled();
    expect(loadingService.start).toHaveBeenCalled();
    expect(loadingService.end).toHaveBeenCalled();
  });

  it('should notify but not emit on http error', () => {
    httpClient.get = jest.fn().mockReturnValue(throwError(() => new Error('Intended test error')));
    translateService.instant = jest.fn();

    notificationService.addError = jest.fn();
    taskDraftService.addTasks = jest.fn();

    component.onLoadButtonClicked();

    expect(notificationService.addError).toHaveBeenCalled();
    expect(taskDraftService.addTasks).not.toHaveBeenCalled();
    expect(loadingService.start).toHaveBeenCalled();
    expect(loadingService.end).toHaveBeenCalled();
  });
});
