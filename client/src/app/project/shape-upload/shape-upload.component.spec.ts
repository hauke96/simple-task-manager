import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeUploadComponent } from './shape-upload.component';

describe('ShapeUploadComponent', () => {
  let component: ShapeUploadComponent;
  let fixture: ComponentFixture<ShapeUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeUploadComponent ]
    })
    .compileComponents();
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
