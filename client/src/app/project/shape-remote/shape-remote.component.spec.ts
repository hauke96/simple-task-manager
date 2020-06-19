import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeRemoteComponent } from './shape-remote.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { NotificationService } from '../../common/notification.service';
import { GeometryService } from '../../common/geometry.service';

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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShapeRemoteComponent],
      imports: [
        HttpClientTestingModule
      ]
    })
      .compileComponents();

    httpClient = TestBed.inject(HttpClient);
    notificationService = TestBed.inject(NotificationService);
    geometryService = TestBed.inject(GeometryService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeRemoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit feature after load', () => {
    const expectedCoordinates = [[[0, 0], [2, 0], [1, 1], [0, 0]]];

    spyOn(httpClient, 'get').and.returnValue(of(remoteGeometry));
    const eventSpy = spyOn(component.featuresLoaded, 'emit').and.callFake((f: Feature[]) => {
      expect(f.length).toEqual(1);
      expect((f[0].getGeometry() as Polygon).getCoordinates()).toEqual(expectedCoordinates);
    });

    component.onLoadButtonClicked();

    expect(eventSpy).toHaveBeenCalled();
  });

  it('should notify but not emit on parsing error', () => {
    spyOn(httpClient, 'get').and.returnValue(of(remoteGeometry));
    spyOn(geometryService, 'toUsableTaskFeature').and.throwError('Intended test error');

    const notificationSpy = spyOn(notificationService, 'addError');
    const emitSpy = spyOn(component.featuresLoaded, 'emit');

    component.onLoadButtonClicked();

    expect(notificationSpy).toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should notify but not emit on http error', () => {
    spyOn(httpClient, 'get').and.returnValue(throwError('Intended test error'));

    const notificationSpy = spyOn(notificationService, 'addError');
    const emitSpy = spyOn(component.featuresLoaded, 'emit');

    component.onLoadButtonClicked();

    expect(notificationSpy).toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
