import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingToolbarComponent } from './drawing-toolbar.component';

describe('DrawingToolbarComponent', () => {
  let component: DrawingToolbarComponent;
  let fixture: ComponentFixture<DrawingToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawingToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
