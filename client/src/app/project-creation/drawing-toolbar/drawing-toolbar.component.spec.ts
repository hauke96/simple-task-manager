import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingToolbarComponent } from './drawing-toolbar.component';
import { Subject } from 'rxjs';
import { ShortcutService } from '../../common/shortcut.service';

describe('DrawingToolbarComponent', () => {
  let component: DrawingToolbarComponent;
  let fixture: ComponentFixture<DrawingToolbarComponent>;
  let shortcutService: ShortcutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DrawingToolbarComponent]
    })
      .compileComponents();

    shortcutService = TestBed.inject(ShortcutService);
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

  it('should deselect selected button', () => {
    component.selectedButton = component.SELECTION_EDIT;
    const spy = spyOn(component.buttonEdit, 'emit');

    // @ts-ignore
    component.onCurrentActiveButton();

    expect(spy).toHaveBeenCalled();
    expect(component.selectedButton).toBeUndefined();
  });

  describe('with shortcuts', () => {
    let shortcutDrawSubject: Subject<void>;
    let shortcutDeleteSubject: Subject<void>;
    let shortcutEditSubject: Subject<void>;
    let shortcutEscapeSubject: Subject<void>;

    beforeEach(() => {
      shortcutDrawSubject = new Subject<void>();
      shortcutDeleteSubject = new Subject<void>();
      shortcutEditSubject = new Subject<void>();
      shortcutEscapeSubject = new Subject<void>();

      spyOn(shortcutService, 'add')
        .withArgs('d').and.returnValue(shortcutDrawSubject.asObservable())
        .withArgs('shift.d').and.returnValue(shortcutDeleteSubject.asObservable())
        .withArgs('e').and.returnValue(shortcutEditSubject.asObservable())
        .withArgs('esc').and.returnValue(shortcutEscapeSubject.asObservable());

      fixture = TestBed.createComponent(DrawingToolbarComponent);
      component = fixture.componentInstance;
      component.resetSelection = new Subject<void>();
      fixture.detectChanges();
    });

    it('should activate draw button on shortcut', () => {
      component.selectedButton = undefined;

      shortcutDrawSubject.next();
      expect(component.selectedButton).toEqual(component.SELECTION_DRAW);

      shortcutDrawSubject.next();
      expect(component.selectedButton).toBeUndefined();
    });

    it('should activate delete button on shortcut', () => {
      component.selectedButton = undefined;

      shortcutDeleteSubject.next();
      expect(component.selectedButton).toEqual(component.SELECTION_DELETE);

      shortcutDeleteSubject.next();
      expect(component.selectedButton).toBeUndefined();
    });

    it('should activate edit button on shortcut', () => {
      component.selectedButton = undefined;

      shortcutEditSubject.next();
      expect(component.selectedButton).toEqual(component.SELECTION_EDIT);

      shortcutEditSubject.next();
      expect(component.selectedButton).toBeUndefined();
    });

    it('should deactivate all buttons on shortcut', () => {
      component.selectedButton = component.SELECTION_EDIT;

      shortcutEscapeSubject.next();
      expect(component.selectedButton).toBeUndefined();

      shortcutEscapeSubject.next();
      expect(component.selectedButton).toBeUndefined();
    });
  });
});
