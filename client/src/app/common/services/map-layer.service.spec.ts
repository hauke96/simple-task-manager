import { MapLayerService } from './map-layer.service';
import BaseLayer from 'ol/layer/Base';

describe(MapLayerService.name, () => {
  let service: MapLayerService;

  beforeEach(() => {
    service = new MapLayerService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call layer added handler', () => {
    // Arrange
    const spy = jest.fn();
    service.onLayerAdded.subscribe(spy);
    const layer = new BaseLayer({});

    // Act
    service.addLayer(layer);

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(layer);
  });

  it('should call fit view handler', () => {
    // Arrange
    const spy = jest.fn();
    service.onFitView.subscribe(spy);
    const extent = [1, 2, 3, 4];

    // Act
    service.fitView(extent);

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(extent);
  });

  it('should call move to outside geometry handler', () => {
    // Arrange
    const spy = jest.fn();
    service.onMoveToOutsideGeometry.subscribe(spy);
    const extent = [1, 2, 3, 4];

    // Act
    service.moveToOutsideGeometry(extent);

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(extent);
  });
});
