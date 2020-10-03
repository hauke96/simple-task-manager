import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShapeDivideComponent } from './shape-divide.component';
import { FormsModule } from '@angular/forms';
import { Polygon } from 'ol/geom';
import { Feature } from 'ol';

describe('ShapeDivideComponent', () => {
  let component: ShapeDivideComponent;
  let fixture: ComponentFixture<ShapeDivideComponent>;

  beforeEach(waitForAsync(() => {
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

  it('should emit event when clicked on divide button', () => {
    const spy = spyOn(component.shapesCreated, 'emit');
    component.selectedPolygon = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    component.gridCellSize = 100;

    // Execute the same test for all supported shapes
    ['squareGrid', 'hexGrid', 'triangleGrid'].forEach(g => {
      component.gridCellShape = g;
      component.onDivideButtonClicked();
    });

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('should emit event when clicked on divide button', () => {
    const spy = spyOn(component.shapesCreated, 'emit');
    component.selectedPolygon = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    component.gridCellSize = 100;

    // Execute the same test for these NOT supported shapes
    ['fooGrid', null, 0, undefined].forEach(g => {
      component.gridCellShape = '' + g;
      component.onDivideButtonClicked();
    });

    expect(spy).not.toHaveBeenCalled();
  });
});
