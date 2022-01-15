import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapComponent } from './map.component';
import { MapLayerService } from '../../services/map-layer.service';
import BaseLayer from 'ol/layer/Base';
import { Feature } from 'ol';
import { Geometry, Point } from 'ol/geom';
import { Interaction } from 'ol/interaction';
import Select from 'ol/interaction/Select';

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

  it('should have one initial layer', () => {
    // @ts-ignore
    expect(component.map.getLayers().getLength()).toBe(1);
  });

  it('should not have initial interactions', () => {
    // @ts-ignore
    expect(component.map.getInteractions().getLength()).toBe(9); // default interactions
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

    describe('with remove call', () => {
      beforeEach(() => {
        mapLayerService.removeLayer(layer);
      });

      it('should remove layer from map', () => {
        // @ts-ignore
        expect(component.map.getLayers().getLength()).toEqual(1);
        // @ts-ignore
        expect(component.map.getLayers().item(0)).not.toEqual(layer);
      });
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

  describe('with fit spy', () => {
    let spy: jasmine.Spy;

    beforeEach(() => {
      // @ts-ignore
      spy = spyOn(component.map.getView(), 'fit');
    });

    describe('with geometries', () => {
      beforeEach(() => {
        mapLayerService.fitToFeatures([new Feature<Geometry>(new Point([10, 10])), new Feature<Geometry>(new Point([100, 100]))]);
      });

      it('should adjust view fit', () => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('with features without geometries', () => {
      beforeEach(() => {
        mapLayerService.fitToFeatures([new Feature<Geometry>(), new Feature<Geometry>()]);
      });

      it('should not adjust view fit', () => {
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('without geometries', () => {
      beforeEach(() => {
        mapLayerService.fitToFeatures([]);
      });

      it('should not adjust view fit', () => {
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('with center map view call', () => {
    const newCenter = [23, 45];
    let spy: jasmine.Spy;

    beforeEach(() => {
      // @ts-ignore
      spy = spyOn(component.map.getView(), 'setCenter');

      mapLayerService.centerView(newCenter);
    });

    it('should adjust view center', () => {
      expect(spy).toHaveBeenCalledWith(newCenter);
    });
  });

  describe('with add interaction call', () => {
    let interaction: Interaction;

    beforeEach(() => {
      interaction = new Select();
      mapLayerService.addInteraction(interaction);
    });

    it('should have one interaction', () => {
      // @ts-ignore
      expect(component.map.getInteractions().getLength()).toBe(10);
    });

    describe('with remove interaction call', () => {
      beforeEach(() => {
        mapLayerService.removeInteraction(interaction);
      });

      it('should have no interaction anymore', () => {
        // @ts-ignore
        expect(component.map.getInteractions().getLength()).toBe(9); // default interactions remain
      });
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
