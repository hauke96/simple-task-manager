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
    expect(service.getProcessPointsColor(0, 120)).toEqual('#ff0000');
    expect(service.getProcessPointsColor(59, 120)).toEqual('#fffb00');
    expect(service.getProcessPointsColor(60, 120)).toEqual('#ffff00');
    expect(service.getProcessPointsColor(120, 120)).toEqual('#00ff00');
    expect(() => service.getProcessPointsColor(0, 0)).toThrow();
    expect(() => service.getProcessPointsColor(-5, 10)).toThrow();
    expect(() => service.getProcessPointsColor(5, -10)).toThrow();
  });
});
