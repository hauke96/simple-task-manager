import { TestBed } from '@angular/core/testing';

import { ProcessPointColorService } from './process-point-color.service';

describe('ProcessPointColorService', () => {
  let service: ProcessPointColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessPointColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return correct color', () => {
    expect(service.getProcessPointsColor(0, 120)).toEqual('#e60000');
    expect(service.getProcessPointsColor(59, 120)).toEqual('#d2cf00');
    expect(service.getProcessPointsColor(60, 120)).toEqual('#d2d200');
    expect(service.getProcessPointsColor(120, 120)).toEqual('#00be00');
    expect(() => service.getProcessPointsColor(0, 0)).toThrow();
    expect(() => service.getProcessPointsColor(-5, 10)).toThrow();
    expect(() => service.getProcessPointsColor(5, -10)).toThrow();
  });
});
