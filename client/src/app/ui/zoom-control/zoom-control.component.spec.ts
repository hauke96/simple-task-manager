import { ZoomControlComponent } from './zoom-control.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(ZoomControlComponent.name, () => {
  let component: ZoomControlComponent;
  let fixture: MockedComponentFixture<ZoomControlComponent>;

  beforeEach(() => MockBuilder(ZoomControlComponent, AppModule));

  beforeEach(() => {
    fixture = MockRender(ZoomControlComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fire zoom in event', () => {
    const zoomSpy = jest.fn();
    component.buttonZoomIn.subscribe(zoomSpy);

    component.onButtonZoomIn();

    expect(zoomSpy).toHaveBeenCalled();
  });

  it('should fire zoom out event', () => {
    const zoomSpy = jest.fn();
    component.buttonZoomOut.subscribe(zoomSpy);

    component.onButtonZoomOut();

    expect(zoomSpy).toHaveBeenCalled();
  });
});
