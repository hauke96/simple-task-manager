import { DrawingToolbarComponent } from './drawing-toolbar.component';
import { of, Subject } from 'rxjs';
import { ShortcutService } from '../../common/services/shortcut.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(DrawingToolbarComponent.name, () => {
  let component: DrawingToolbarComponent;
  let fixture: MockedComponentFixture<DrawingToolbarComponent, any>;
  let shortcutService: ShortcutService;

  beforeEach(() => {
    shortcutService = {} as ShortcutService;
    shortcutService.add = jest.fn().mockReturnValue(of());

    return MockBuilder(DrawingToolbarComponent, AppModule)
      .provide({provide: ShortcutService, useFactory: () => shortcutService});
  });

  beforeEach(() => {
    fixture = MockRender(DrawingToolbarComponent, {resetSelection: new Subject()});
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fire draw event', () => {
    const buttonDrawSpy = jest.fn();
    component.buttonDraw.subscribe(buttonDrawSpy);

    component.onButtonDraw();

    expect(buttonDrawSpy).toHaveBeenCalled();
    expect(component.selectedButton).toEqual(component.SELECTION_DRAW);
  });

  it('should fire delete event', () => {
    const buttonDeleteSpy = jest.fn();
    component.buttonDelete.subscribe(buttonDeleteSpy);

    component.onButtonDelete();

    expect(buttonDeleteSpy).toHaveBeenCalled();
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
    const buttonEditSpy = jest.fn();
    component.buttonEdit.subscribe(buttonEditSpy);

    // @ts-ignore
    component.onCurrentActiveButton();

    expect(buttonEditSpy).toHaveBeenCalled();
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

      shortcutService.add = jest.fn().mockImplementation(keys => {
        switch (keys) {
          case 'd':
            return shortcutDrawSubject.asObservable();
          case 'shift.d':
            return shortcutDeleteSubject.asObservable();
          case 'e':
            return shortcutEditSubject.asObservable();
          case 'esc':
            return shortcutEscapeSubject.asObservable();
        }
      });

      fixture = MockRender(DrawingToolbarComponent, {resetSelection: new Subject()});
      component = fixture.point.componentInstance;
      fixture.detectChanges();
    });

    it('should activate draw button on shortcut', () => {
      component.selectedButton = undefined;

      shortcutDrawSubject.next();
      // @ts-ignore
      expect(component.selectedButton).toEqual(component.SELECTION_DRAW);

      shortcutDrawSubject.next();
      expect(component.selectedButton).toBeUndefined();
    });

    it('should activate delete button on shortcut', () => {
      component.selectedButton = undefined;

      shortcutDeleteSubject.next();
      // @ts-ignore
      expect(component.selectedButton).toEqual(component.SELECTION_DELETE);

      shortcutDeleteSubject.next();
      expect(component.selectedButton).toBeUndefined();
    });

    it('should activate edit button on shortcut', () => {
      component.selectedButton = undefined;

      shortcutEditSubject.next();
      // @ts-ignore
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
