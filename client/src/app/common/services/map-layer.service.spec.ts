import { TestBed } from '@angular/core/testing';

import { MapLayerService } from './map-layer.service';

describe('MapLayerService', () => {
  let service: MapLayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapLayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
