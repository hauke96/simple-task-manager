import { NotificationComponent } from './notification.component';
import { LoadingService } from '../../common/services/loading.service';
import { NotificationService } from '../../common/services/notification.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(NotificationComponent.name, () => {
  let component: NotificationComponent;
  let fixture: MockedComponentFixture<NotificationComponent>;
  let loadingService: LoadingService;
  let notificationService: NotificationService;

  beforeEach(() => {
    loadingService = {} as LoadingService;
    loadingService.isLoading = jest.fn();
    notificationService = {} as NotificationService;
    notificationService.hasError = jest.fn();
    notificationService.hasWarning = jest.fn();
    notificationService.hasInfo = jest.fn();

    return MockBuilder(NotificationComponent, AppModule)
      .provide({provide: LoadingService, useFactory: () => loadingService})
      .provide({provide: NotificationService, useFactory: () => notificationService});
  });

  beforeEach(() => {
    fixture = MockRender(NotificationComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get loading state correctly', () => {
    loadingService.isLoading = jest.fn().mockReturnValue(true);
    expect(component.isLoading).toEqual(true);

    loadingService.isLoading = jest.fn().mockReturnValue(false);
    expect(component.isLoading).toEqual(false);
  });

  it('should get existing notification state correctly', () => {
    notificationService.hasError = jest.fn().mockReturnValue(true);
    expect(component.hasError).toEqual(true);

    notificationService.hasWarning = jest.fn().mockReturnValue(true);
    expect(component.hasWarning).toEqual(true);

    notificationService.hasInfo = jest.fn().mockReturnValue(true);
    expect(component.hasInfo).toEqual(true);
  });

  it('should get not existing notification state correctly', () => {
    notificationService.hasError = jest.fn().mockReturnValue(false);
    expect(component.hasError).toEqual(false);

    notificationService.hasWarning = jest.fn().mockReturnValue(false);
    expect(component.hasWarning).toEqual(false);

    notificationService.hasInfo = jest.fn().mockReturnValue(false);
    expect(component.hasInfo).toEqual(false);
  });

  it('should get notification test correctly', () => {
    const errorText = 'Some test error';
    notificationService.getError = jest.fn().mockReturnValue(errorText);
    expect(component.currentErrorText).toEqual(errorText);

    const warningText = 'Some test warning';
    notificationService.getWarning = jest.fn().mockReturnValue(warningText);
    expect(component.currentWarningText).toEqual(warningText);

    const infoText = 'Some test info';
    notificationService.getInfo = jest.fn().mockReturnValue(infoText);
    expect(component.currentInfoText).toEqual(infoText);
  });

  it('should close notifications correctly', () => {
    notificationService.dropError = jest.fn();
    component.onCloseErrorButtonClicked();
    expect(notificationService.dropError).toHaveBeenCalled();

    notificationService.dropWarning = jest.fn();
    component.onCloseWarningButtonClicked();
    expect(notificationService.dropError).toHaveBeenCalled();

    notificationService.dropInfo = jest.fn();
    component.onCloseInfoButtonClicked();
    expect(notificationService.dropInfo).toHaveBeenCalled();
  });

  it('should get the amount of notifications correctly', () => {
    notificationService.remainingErrors = jest.fn().mockReturnValue(3);
    expect(component.remainingErrors).toEqual(3);

    notificationService.remainingWarning = jest.fn().mockReturnValue(2);
    expect(component.remainingWarning).toEqual(2);

    notificationService.remainingInfo = jest.fn().mockReturnValue(1);
    expect(component.remainingInfo).toEqual(1);
  });
});
