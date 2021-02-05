import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarComponent } from './progress-bar.component';
import { ProcessPointColorService } from '../../common/process-point-color.service';

describe('ProjectProgressBarComponent', () => {
  let component: ProgressBarComponent;
  let fixture: ComponentFixture<ProgressBarComponent>;
  let colorService: ProcessPointColorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgressBarComponent ]
    })
    .compileComponents();

    colorService = TestBed.inject(ProcessPointColorService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate percentage correctly', () => {
    component.totalPoints = 300;
    component.progressPoints = 196; // -> 65.33333%
    expect(component.getProcessPointPercentage()).toEqual(65);

    component.totalPoints = 200;
    component.progressPoints = 1; // -> 0.5%
    expect(component.getProcessPointPercentage()).toEqual(1);

    component.totalPoints = 200;
    component.progressPoints = 42; // -> 21.0%
    expect(component.getProcessPointPercentage()).toEqual(21);
  });

  it('should call color service for point color', () => {
    const spy = spyOn(colorService, 'getProcessPointsColor');

    component.totalPoints = 100;
    component.progressPoints = 10;
    component.getProcessPointColor();

    expect(spy).toHaveBeenCalledWith(10, 100);
  });

  it('should get correct process point width', () => {
    component.totalPoints = 100;
    component.progressPoints = 0;
    expect(component.getProcessPointWidth()).toEqual('0px');

    component.totalPoints = 100;
    component.progressPoints = 33;
    expect(component.getProcessPointWidth()).toEqual('33px');

    component.totalPoints = 100;
    component.progressPoints = 66;
    // normal rounding would result in 67px but we want the floor-rounding:
    expect(component.getProcessPointWidth()).toEqual('66px');

    component.totalPoints = 100;
    component.progressPoints = 100;
    expect(component.getProcessPointWidth()).toEqual('100px');
  });
});
