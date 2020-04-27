import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeDivideComponent } from './shape-divide.component';

describe('ShapeDivideComponent', () => {
  let component: ShapeDivideComponent;
  let fixture: ComponentFixture<ShapeDivideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeDivideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeDivideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
