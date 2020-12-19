import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingToolbarComponent } from './drawing-toolbar.component';
import { Subject } from 'rxjs';

describe('DrawingToolbarComponent', () => {
  let component: DrawingToolbarComponent;
  let fixture: ComponentFixture<DrawingToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DrawingToolbarComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingToolbarComponent);
    component = fixture.componentInstance;
    component.resetSelection = new Subject<void>();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fire draw event', () => {
    const spy = spyOn(component.buttonDraw, 'emit');

    component.onButtonDraw();

    expect(spy).toHaveBeenCalled();
    expect(component.selectedButton).toEqual(component.SELECTION_DRAW);
  });

  it('should fire delete event', () => {
    const spy = spyOn(component.buttonDelete, 'emit');

    component.onButtonDelete();

    expect(spy).toHaveBeenCalled();
    expect(component.selectedButton).toEqual(component.SELECTION_DELETE);
  });

  it('should toggle draw selection correctly', () => {
    component.onButtonDraw();
    expect(component.selectedButton).toEqual(component.SELECTION_DRAW);

    component.onButtonDraw();
    expect(component.selectedButton).toBeUndefined();
  });

  it('should toggle delete selection correctly', () => {
    component.onButtonDelete();
    expect(component.selectedButton).toEqual(component.SELECTION_DELETE);

    component.onButtonDelete();
    expect(component.selectedButton).toBeUndefined();
  });

  it('should reset selection on subject call', () => {
    component.selectedButton = component.SELECTION_DRAW;

    component.resetSelection.next();

    expect(component.selectedButton).toBeUndefined();
  });
});
