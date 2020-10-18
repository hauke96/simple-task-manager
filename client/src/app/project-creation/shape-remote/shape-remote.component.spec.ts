import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShapeRemoteComponent } from './shape-remote.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { NotificationService } from '../../common/notification.service';
import { GeometryService } from '../../common/geometry.service';
import { LoadingService } from '../../common/loading.service';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskDraftService } from '../task-draft.service';
import { TaskDraft } from '../task-draft';

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

describe('ShapeRemoteComponent', () => {
  let component: ShapeRemoteComponent;
  let fixture: ComponentFixture<ShapeRemoteComponent>;
  let httpClient: HttpClient;
  let notificationService: NotificationService;
  let geometryService: GeometryService;
  let loadingService: LoadingService;
  let taskDraftService: TaskDraftService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ShapeRemoteComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();

    httpClient = TestBed.inject(HttpClient);
    notificationService = TestBed.inject(NotificationService);
    geometryService = TestBed.inject(GeometryService);
    loadingService = TestBed.inject(LoadingService);
    taskDraftService = TestBed.inject(TaskDraftService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeRemoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading spinner on load', () => {
    const spy = spyOn(loadingService, 'start');
    component.onLoadButtonClicked();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit feature after load', () => {
    const expectedCoordinates = [[[0, 0], [2, 0], [1, 1], [0, 0]]];

    spyOn(httpClient, 'get').and.returnValue(of(remoteGeometry));
    const eventSpy = spyOn(taskDraftService, 'addTasks').and.callFake((t: TaskDraft[]) => {
      expect(t.length).toEqual(1);
      expect((t[0].geometry as Polygon).getCoordinates()).toEqual(expectedCoordinates);
    });

    component.onLoadButtonClicked();

    expect(eventSpy).toHaveBeenCalled();
  });

  it('should notify but not emit on parsing error', () => {
    spyOn(httpClient, 'get').and.returnValue(of(remoteGeometry));
    spyOn(geometryService, 'toUsableTaskFeature').and.throwError('Intended test error');

    const notificationSpy = spyOn(notificationService, 'addError');
    const addSpy = spyOn(taskDraftService, 'addTasks');
    const loadingSpy = spyOn(loadingService, 'end');

    component.onLoadButtonClicked();

    expect(notificationSpy).toHaveBeenCalled();
    expect(addSpy).not.toHaveBeenCalled();
    expect(loadingSpy).toHaveBeenCalled();
  });

  it('should notify but not emit on http error', () => {
    spyOn(httpClient, 'get').and.returnValue(throwError('Intended test error'));

    const notificationSpy = spyOn(notificationService, 'addError');
    const addSpy = spyOn(taskDraftService, 'addTasks');
    const loadingSpy = spyOn(loadingService, 'end');

    component.onLoadButtonClicked();

    expect(notificationSpy).toHaveBeenCalled();
    expect(addSpy).not.toHaveBeenCalled();
    expect(loadingSpy).toHaveBeenCalled();
  });
});
