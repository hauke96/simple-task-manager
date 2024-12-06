import { ToolbarComponent } from './toolbar.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(ToolbarComponent.name, () => {
  let component: ToolbarComponent;
  let fixture: MockedComponentFixture<ToolbarComponent>;

  beforeEach(() => MockBuilder(ToolbarComponent, AppModule));

  beforeEach(() => {
    fixture = MockRender(ToolbarComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
