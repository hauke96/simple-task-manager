import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibilityNoticeComponent } from './responsibility-notice.component';

describe('ResponsibilityNoticeComponent', () => {
  let component: ResponsibilityNoticeComponent;
  let fixture: ComponentFixture<ResponsibilityNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResponsibilityNoticeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponsibilityNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
