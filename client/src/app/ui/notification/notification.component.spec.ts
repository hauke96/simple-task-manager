import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationComponent } from './notification.component';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingService } from '../../common/loading.service';
import { ErrorService } from '../../common/error.service';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let loadingService: LoadingService;
  let errorService: ErrorService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NotificationComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();

    loadingService = TestBed.inject(LoadingService);
    errorService = TestBed.inject(ErrorService);
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

  it('should get existing error state correctly', () => {
    spyOn(errorService, 'hasError').and.returnValue(true);
    expect(component.hasError).toEqual(true);
  });

  it('should get not existing error state correctly', () => {
    spyOn(errorService, 'hasError').and.returnValue(false);
    expect(component.hasError).toEqual(false);
  });

  it('should get error test correctly', () => {
    const errorText = 'Some test error';
    spyOn(errorService, 'getError').and.returnValue(errorText);

    expect(component.currentErrorText).toEqual(errorText);
  });

  it('should close error correctly', () => {
    errorService.addError('some error');
    expect(errorService.hasError()).toEqual(true);

    component.onCloseErrorButtonClicked();

    expect(errorService.hasError()).toEqual(false);
  });
});
