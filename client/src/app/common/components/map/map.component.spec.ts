import { MapComponent } from './map.component';
import { MapLayerService } from '../../services/map-layer.service';
import BaseLayer from 'ol/layer/Base';
import { Feature, Map } from 'ol';
import { Geometry, Point } from 'ol/geom';
import { Interaction } from 'ol/interaction';
import Select from 'ol/interaction/Select';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { Subject } from 'rxjs';
import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';

describe(MapComponent.name, () => {
  let component: MapComponent;
  let fixture: MockedComponentFixture<MapComponent>;
  let mapLayerService: MapLayerService;

  let layerAddedSubject: Subject<BaseLayer>;
  let layerRemovedSubject: Subject<BaseLayer>;
  let interactionAddedSubject: Subject<Interaction>;
  let interactionRemovedSubject: Subject<Interaction>;
  let firViewSubject: Subject<Extent>;
  let fitToFeatureSubject: Subject<Feature<Geometry>[]>;
  let centerViewSubject: Subject<Coordinate>;
  let moveToOutsideGeometrySubject: Subject<Extent>;

  beforeEach(() => {
    layerAddedSubject = new Subject<BaseLayer>();
    layerRemovedSubject = new Subject<BaseLayer>();
    interactionAddedSubject = new Subject<Interaction>();
    interactionRemovedSubject = new Subject<Interaction>();
    firViewSubject = new Subject<Extent>();
    fitToFeatureSubject = new Subject<Feature<Geometry>[]>();
    centerViewSubject = new Subject<Coordinate>();
    moveToOutsideGeometrySubject = new Subject<Extent>();

    mapLayerService = {
      onLayerAdded: layerAddedSubject.asObservable(),
      onLayerRemoved: layerRemovedSubject.asObservable(),
      onInteractionAdded: interactionAddedSubject.asObservable(),
      onInteractionRemoved: interactionRemovedSubject.asObservable(),
      onFitView: firViewSubject.asObservable(),
      onFitToFeatures: fitToFeatureSubject.asObservable(),
      onCenterView: centerViewSubject.asObservable(),
      onMoveToOutsideGeometry: moveToOutsideGeometrySubject.asObservable(),
    } as MapLayerService;

    return MockBuilder(MapComponent, AppModule)
      .provide({provide: MapLayerService, useFactory: () => mapLayerService});
  });

  beforeEach(() => {
    fixture = MockRender(MapComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have one initial layer', () => {
    expect(component.map.getLayers().getLength()).toBe(1);
  });

  it('should not have initial interactions', () => {
    expect(component.map.getInteractions().getLength()).toBe(9); // default interactions
  });

  describe('with zoom', () => {
    beforeEach(() => {
      component.map.getView().setZoom(5);
      component.map.getView().animate = jest.fn();
    });

    it('should zoom in', () => {
      // Act
      component.onZoomIn();

      // Assert
      expect(component.map.getView().animate).toHaveBeenCalledTimes(1);
      expect(component.map.getView().animate).toHaveBeenCalledWith({zoom: 5.5, duration: 250});
    });

    it('should zoom out', () => {
      // Act
      component.onZoomOut();

      // Assert
      expect(component.map.getView().animate).toHaveBeenCalledTimes(1);
      expect(component.map.getView().animate).toHaveBeenCalledWith({zoom: 4.5, duration: 250});
    });

    describe('without map', () => {
      let animateFn: jest.FunctionLike;

      beforeEach(() => {
        animateFn = component.map.getView().animate;
        // @ts-ignore
        component.map = undefined;
      });

      it('should not zoom in', () => {
        // Act
        component.onZoomIn();

        // Assert
        expect(animateFn).not.toHaveBeenCalled();
      });

      it('should not zoom out', () => {
        // Act
        component.onZoomOut();

        // Assert
        expect(animateFn).not.toHaveBeenCalled();
      });
    });
  });

  describe('with added layer', () => {
    let layer: BaseLayer;

    beforeEach(() => {
      layer = new BaseLayer({properties: {foo: 'bar'}});
      layerAddedSubject.next(layer);
    });

    it('should add layer', () => {
      expect(component.map.getLayers().item(1)).toEqual(layer); // index 0 is the OSM base layer
    });

    describe('with remove call', () => {
      beforeEach(() => {
        layerRemovedSubject.next(layer);
      });

      it('should remove layer from map', () => {
        expect(component.map.getLayers().getLength()).toEqual(1);
        expect(component.map.getLayers().item(0)).not.toEqual(layer);
      });
    });
  });

  describe('with fit view call', () => {
    const mockSize = [4, 5];
    const padding = [25, 25, 25, 25];

    let extent: number[];

    beforeEach(() => {
      component.map.getView().fit = jest.fn();
      component.map.getSize = jest.fn().mockReturnValue(mockSize);

      extent = [0, 1, 2, 3];
      firViewSubject.next(extent);
    });

    it('should adjust view fit', () => {
      expect(component.map.getView().fit).toHaveBeenCalledTimes(1);
      expect(component.map.getView().fit).toHaveBeenCalledWith(extent, {size: mockSize, padding});
    });
  });

  describe('with fit', () => {
    beforeEach(() => {
      component.map.getView().fit = jest.fn();
    });

    describe('with geometries', () => {
      beforeEach(() => {
        fitToFeatureSubject.next([new Feature<Geometry>(new Point([10, 10])), new Feature<Geometry>(new Point([100, 100]))]);
      });

      it('should adjust view fit', () => {
        expect(component.map.getView().fit).toHaveBeenCalledTimes(1);
      });
    });

    describe('with features without geometries', () => {
      beforeEach(() => {
        fitToFeatureSubject.next([new Feature<Geometry>(), new Feature<Geometry>()]);
      });

      it('should not adjust view fit', () => {
        expect(component.map.getView().fit).not.toHaveBeenCalled();
      });
    });

    describe('without geometries', () => {
      beforeEach(() => {
        fitToFeatureSubject.next([]);
      });

      it('should not adjust view fit', () => {
        expect(component.map.getView().fit).not.toHaveBeenCalled();
      });
    });
  });

  describe('with center map view call', () => {
    const newCenter = [23, 45];

    beforeEach(() => {
      component.map.getView().setCenter = jest.fn();

      centerViewSubject.next(newCenter);
    });

    it('should adjust view center', () => {
      expect(component.map.getView().setCenter).toHaveBeenCalledWith(newCenter);
    });
  });

  describe('with add interaction call', () => {
    let interaction: Interaction;

    beforeEach(() => {
      interaction = new Select();
      interactionAddedSubject.next(interaction);
    });

    it('should have one interaction', () => {
      expect(component.map.getInteractions().getLength()).toBe(10);
    });

    describe('with remove interaction call', () => {
      beforeEach(() => {
        interactionRemovedSubject.next(interaction);
      });

      it('should have no interaction anymore', () => {
        expect(component.map.getInteractions().getLength()).toBe(9); // default interactions remain
      });
    });
  });

  describe('with move outside geometry call', () => {
    const requestedExtent: number[] = [0, 0, 100, 100];

    let mapExtent: number[];

    beforeEach(() => {
      component.map.getView().setCenter = jest.fn();
    });

    describe('without outside geometry', () => {
      beforeEach(() => {
        mapExtent = [50, 50, 100, 100];
        component.map.getView().calculateExtent = jest.fn().mockReturnValue(mapExtent);
        moveToOutsideGeometrySubject.next(requestedExtent);
      });

      it('should not move map', () => {
        expect(component.map.getView().setCenter).not.toHaveBeenCalled();
      });
    });

    describe('with outside geometry', () => {
      beforeEach(() => {
        mapExtent = [1000, 1000, 1010, 1010];
        component.map.getView().calculateExtent = jest.fn().mockReturnValue(mapExtent);
        moveToOutsideGeometrySubject.next(requestedExtent);
      });

      it('should move map', () => {
        expect(component.map.getView().setCenter).toHaveBeenCalledWith([50, 50]);
      });
    });
  });
});
