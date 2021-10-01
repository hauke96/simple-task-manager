import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapComponent } from './map.component';
import { MapLayerService } from '../../services/map-layer.service';
import BaseLayer from 'ol/layer/Base';
import { Feature } from 'ol';
import { OnReturn } from 'ol/Observable';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mapLayerService: MapLayerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapComponent],
      providers: [MapLayerService]
    })
      .compileComponents();

    mapLayerService = TestBed.inject(MapLayerService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('with zoom and spy', () => {
    let spy: jasmine.Spy;

    beforeEach(() => {
      // @ts-ignore
      component.map.getView().setZoom(5);
      // @ts-ignore
      spy = spyOn(component.map.getView(), 'animate');
    });

    it('should zoom in', () => {
      // Act
      component.onZoomIn();

      // Assert
      expect(spy).toHaveBeenCalledOnceWith({zoom: 5.5, duration: 250});
    });

    it('should zoom out', () => {
      // Act
      component.onZoomOut();

      // Assert
      expect(spy).toHaveBeenCalledOnceWith({zoom: 4.5, duration: 250});
    });

    describe('without map', () => {

      beforeEach(() => {
        // @ts-ignore
        component.map = undefined;
      });

      it('should not zoom in', () => {
        // Act
        component.onZoomIn();

        // Assert
        expect(spy).not.toHaveBeenCalled();
      });

      it('should not zoom out', () => {
        // Act
        component.onZoomOut();

        // Assert
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('with added layer', () => {
    let layer: BaseLayer;

    beforeEach(() => {
      layer = new BaseLayer({properties: {foo: 'bar'}});
      // @ts-ignore
      mapLayerService.addLayer(layer);
    });

    it('should add layer', () => {
      // @ts-ignore
      expect(component.map.getLayers().item(1)).toEqual(layer); // index 0 is the OSM base layer
    });
  });

  describe('with fit view call', () => {
    const mockSize = [4, 5];
    const padding = [25, 25, 25, 25];

    let extent: number[];
    let spy: jasmine.Spy;

    beforeEach(() => {
      // @ts-ignore
      spy = spyOn(component.map.getView(), 'fit'); // @ts-ignore
      spyOn(component.map, 'getSize').and.returnValue(mockSize);

      extent = [0, 1, 2, 3];
      mapLayerService.fitView(extent);
    });

    it('should adjust view fit', () => {
      // @ts-ignore
      expect(spy).toHaveBeenCalledOnceWith(extent, {size: mockSize, padding});
    });
  });

  describe('with move outside geometry call', () => {
    const requestedExtent: number[] = [0, 0, 100, 100];

    let mapExtent: number[];
    let spy: jasmine.Spy;

    beforeEach(() => {
      // @ts-ignore
      spy = spyOn(component.map.getView(), 'setCenter'); // @ts-ignore
    });

    describe('without outside geometry', () => {
      beforeEach(() => {
        mapExtent = [50, 50, 100, 100];
        // @ts-ignore
        spyOn(component.map.getView(), 'calculateExtent').and.returnValue(mapExtent);
        mapLayerService.moveToOutsideGeometry(requestedExtent);
      });

      it('should not move map', () => {
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('with outside geometry', () => {
      beforeEach(() => {
        mapExtent = [1000, 1000, 1010, 1010];
        // @ts-ignore
        spyOn(component.map.getView(), 'calculateExtent').and.returnValue(mapExtent);
        mapLayerService.moveToOutsideGeometry(requestedExtent);
      });

      it('should move map', () => {
        expect(spy).toHaveBeenCalledWith([50, 50]);
      });
    });
  });
});
