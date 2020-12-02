import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShapeUploadComponent } from './shape-upload.component';
import { NotificationService } from '../../common/notification.service';
import { TaskDraftService } from '../task-draft.service';

describe('ShapeUploadComponent', () => {
  let component: ShapeUploadComponent;
  let fixture: ComponentFixture<ShapeUploadComponent>;
  let notificationService: NotificationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ShapeUploadComponent],
      providers: [TaskDraftService]
    })
      .compileComponents();

    notificationService = TestBed.inject(NotificationService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
