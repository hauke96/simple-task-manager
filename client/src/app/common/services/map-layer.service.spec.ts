import { TestBed } from '@angular/core/testing';

import { MapLayerService } from './map-layer.service';
import BaseLayer from 'ol/layer/Base';
import createSpy = jasmine.createSpy;

describe('MapLayerService', () => {
  let service: MapLayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapLayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call layer added handler', () => {
    // Arrange
    const spy = createSpy();
    service.onLayerAdded.subscribe(spy);
    const layer = new BaseLayer({});

    // Act
    service.addLayer(layer);

    // Assert
    expect(spy).toHaveBeenCalledOnceWith(layer);
  });

  it('should call fit view handler', () => {
    // Arrange
    const spy = createSpy();
    service.onFitView.subscribe(spy);
    const extent = [1, 2, 3, 4];

    // Act
    service.fitView(extent);

    // Assert
    expect(spy).toHaveBeenCalledOnceWith(extent);
  });

  it('should call move to outside geometry handler', () => {
    // Arrange
    const spy = createSpy();
    service.onMoveToOutsideGeometry.subscribe(spy);
    const extent = [1, 2, 3, 4];

    // Act
    service.moveToOutsideGeometry(extent);

    // Assert
    expect(spy).toHaveBeenCalledOnceWith(extent);
  });
});
