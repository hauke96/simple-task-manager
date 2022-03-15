import { TabsComponent } from './tabs.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(TabsComponent.name, () => {
  let component: TabsComponent;
  let fixture: MockedComponentFixture<TabsComponent, any>;

  beforeEach(() => {
    return MockBuilder(TabsComponent, AppModule);
  });

  beforeEach(() => {
    fixture = MockRender(TabsComponent, {
      tabs: ['tab 1', 'tab 2']
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select tab correctly', () => {
    const eventSpy = jest.fn();
    component.tabSelected.subscribe(eventSpy);

    component.onTabClicked('tab 1');
    expect(eventSpy).toHaveBeenCalledWith(0);

    component.onTabClicked('tab 2');
    expect(eventSpy).toHaveBeenCalledWith(1);
  });
});
