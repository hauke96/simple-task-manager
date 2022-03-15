import { ShortcutService } from './shortcut.service';
import { EventManager } from '@angular/platform-browser';

describe(ShortcutService.name, () => {
  let service: ShortcutService;
  let eventManager: EventManager;
  let document: any;

  beforeEach(() => {
    eventManager = {} as EventManager;
    document = {} as Document;

    service = new ShortcutService(eventManager, document);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call event dashboard', () => {
    eventManager.addEventListener = jest.fn();

    service.add('shift.d').subscribe();

    // @ts-ignore
    expect(eventManager.addEventListener).toHaveBeenCalledWith(window.document.documentElement, 'keydown.shift.d', expect.any(Function));
  });
});
