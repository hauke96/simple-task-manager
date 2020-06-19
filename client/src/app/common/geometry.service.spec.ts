import { TestBed } from '@angular/core/testing';

import { GeometryService } from './geometry.service';
import { GeometryCollection, LineString, Polygon } from 'ol/geom';
import { Feature } from 'ol';

/**
 * This service is also tested via the tests of the shape-creation components (mainly the "shape-upload" component), so we son't have any
 * huge test data here.
 */
describe('GeometryService', () => {
  let service: GeometryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeometryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should preserve simple geometries', () => {
    // Create two overlapping geometries
    const f1 = new Polygon([[[0, 0], [10, 0], [5, 5]]]);
    const f2 = new Polygon([[[5, 0], [15, 0], [10, 5]]]);

    const features = service.toUsableTaskFeature(new Feature(new GeometryCollection([f1, f2])));

    expect(features.length).toEqual(2);
    expect((features[0].getGeometry() as Polygon).getCoordinates()).toEqual(f1.getCoordinates());
    expect((features[1].getGeometry() as Polygon).getCoordinates()).toEqual(f2.getCoordinates());
  });

  it('should preserve feature properties', () => {
    const f = new Feature(new Polygon([[[0, 0], [10, 0], [5, 5]]]));
    f.set('name', 'foobar');
    f.set('__123', '456__');

    const newFeature = service.toUsableTaskFeature(f);

    expect(newFeature.length).toEqual(1);
    expect(newFeature[0].get('name')).toEqual('foobar');
    expect(newFeature[0].get('__123')).toEqual('456__');
  });

  it('should not fail on null', () => {
    let f = service.toUsableTaskFeature(null);
    expect(f).toEqual([]);

    f = service.toUsableTaskFeature(undefined);
    expect(f).toEqual([]);

    // @ts-ignore
    f = service.toUsableTaskFeature(0);
    expect(f).toEqual([]);

    // @ts-ignore
    f = service.toUsableTaskFeature('');
    expect(f).toEqual([]);
  });

  it('should ignore unclosed line string', () => {
    const f = new Feature(new LineString([[0, 0], [2, 5], [6, -4], [10, 0], [5, 5]]));

    const newFeature = service.toUsableTaskFeature(f);

    expect(newFeature).toEqual([]);
  });
});
