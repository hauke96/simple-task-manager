import { AppComponent } from './app.component';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from './app.module';
import { ConfigProvider } from './config/config.provider';
import { UserListComponent } from './user/user-list/user-list.component';
import { config } from 'rxjs';

describe(AppComponent.name, () => {
  let component: AppComponent;
  let fixture: MockedComponentFixture<AppComponent>;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    configProvider = {} as ConfigProvider;

    return MockBuilder(AppComponent, AppModule)
      .provide({provide: ConfigProvider, useFactory: () => configProvider});
  });

  beforeEach(() => {
    fixture = MockRender(AppComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should return config test environment value', () => {
    configProvider.testEnvironment = false;
    expect(component.isInTestMode).toEqual(false);

    configProvider.testEnvironment = true;
    expect(component.isInTestMode).toEqual(true);
  });
});
