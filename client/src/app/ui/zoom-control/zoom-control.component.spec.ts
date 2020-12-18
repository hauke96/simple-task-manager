import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomControlComponent } from './zoom-control.component';

describe('ZoomControlComponent', () => {
  let component: ZoomControlComponent;
  let fixture: ComponentFixture<ZoomControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZoomControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
