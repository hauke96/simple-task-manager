import { ProgressBarComponent } from './progress-bar.component';
import { ProcessPointColorService } from '../../common/services/process-point-color.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(ProgressBarComponent.name, () => {
  let component: ProgressBarComponent;
  let fixture: MockedComponentFixture<ProgressBarComponent>;
  let colorService: ProcessPointColorService;

  beforeEach(() => {
    colorService = {} as ProcessPointColorService;
    colorService.getProcessPointsColor = jest.fn();

    return MockBuilder(ProgressBarComponent, AppModule)
      .provide({provide: ProcessPointColorService, useFactory: () => colorService});
  });

  beforeEach(() => {
    fixture = MockRender(ProgressBarComponent);
    component = fixture.point.componentInstance;
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
    // Arrange
    colorService.getProcessPointsColor = jest.fn().mockReturnValue('123abc');

    component.totalPoints = 100;
    component.progressPoints = 10;

    // Act
    const color = component.getProcessPointColor();

    // Assert
    expect(colorService.getProcessPointsColor).toHaveBeenCalledWith(10, 100);
    expect(color).toEqual('123abc');
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
