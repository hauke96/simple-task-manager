import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeDivideComponent } from './shape-divide.component';
import { FormsModule } from '@angular/forms';

describe('ShapeDivideComponent', () => {
  let component: ShapeDivideComponent;
  let fixture: ComponentFixture<ShapeDivideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [ShapeDivideComponent]
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
