import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationComponent } from './notification.component';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingService } from '../../common/loading.service';
import { NotificationService } from '../../common/notification.service';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let loadingService: LoadingService;
  let notificationService: NotificationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NotificationComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();

    loadingService = TestBed.inject(LoadingService);
    notificationService = TestBed.inject(NotificationService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get loading state correctly', () => {
    loadingService.loading = true;
    expect(component.isLoading).toEqual(true);

    loadingService.loading = false;
    expect(component.isLoading).toEqual(false);
  });

  it('should get existing notification state correctly', () => {
    spyOn(notificationService, 'hasError').and.returnValue(true);
    expect(component.hasError).toEqual(true);

    spyOn(notificationService, 'hasWarning').and.returnValue(true);
    expect(component.hasWarning).toEqual(true);

    spyOn(notificationService, 'hasInfo').and.returnValue(true);
    expect(component.hasInfo).toEqual(true);
  });

  it('should get not existing notification state correctly', () => {
    spyOn(notificationService, 'hasError').and.returnValue(false);
    expect(component.hasError).toEqual(false);

    spyOn(notificationService, 'hasWarning').and.returnValue(false);
    expect(component.hasWarning).toEqual(false);

    spyOn(notificationService, 'hasInfo').and.returnValue(false);
    expect(component.hasInfo).toEqual(false);
  });

  it('should get notification test correctly', () => {
    const errorText = 'Some test error';
    spyOn(notificationService, 'getError').and.returnValue(errorText);
    expect(component.currentErrorText).toEqual(errorText);

    const warningText = 'Some test warning';
    spyOn(notificationService, 'getWarning').and.returnValue(warningText);
    expect(component.currentWarningText).toEqual(warningText);

    const infoText = 'Some test info';
    spyOn(notificationService, 'getInfo').and.returnValue(infoText);
    expect(component.currentInfoText).toEqual(infoText);
  });

  it('should close notifications correctly', () => {
    notificationService.addError('some error');
    expect(notificationService.hasError()).toEqual(true);
    component.onCloseErrorButtonClicked();
    expect(notificationService.hasError()).toEqual(false);

    notificationService.addWarning('some warning');
    expect(notificationService.hasWarning()).toEqual(true);
    component.onCloseWarningButtonClicked();
    expect(notificationService.hasWarning()).toEqual(false);

    notificationService.addInfo('some info');
    expect(notificationService.hasInfo()).toEqual(true);
    component.onCloseInfoButtonClicked();
    expect(notificationService.hasInfo()).toEqual(false);
  });

  it('should get the amount of notifications correctly', () => {
    notificationService.addError('e1');
    notificationService.addError('e2');
    notificationService.addError('e3');

    notificationService.addWarning('w1');
    notificationService.addWarning('w2');

    notificationService.addInfo('i1');

    expect(component.remainingErrors).toEqual(3);
    expect(component.remainingWarning).toEqual(2);
    expect(component.remainingInfo).toEqual(1);
  });
});
