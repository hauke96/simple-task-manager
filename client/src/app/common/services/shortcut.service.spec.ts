import { TestBed } from '@angular/core/testing';

import { ShortcutService } from './shortcut.service';
import { EventManager } from '@angular/platform-browser';
import anything = jasmine.anything;
import { DOCUMENT } from '@angular/common';

describe('ShortcutService', () => {
  let service: ShortcutService;
  let eventManager: EventManager;
  let document: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShortcutService);

    eventManager = TestBed.inject(EventManager);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call event dashboard', () => {
    const eventManagerSpy = spyOn(eventManager, 'addEventListener').and.returnValue(new Function());

    service.add('shift.d').subscribe();

    expect(eventManagerSpy).toHaveBeenCalledWith(document.documentElement, 'keydown.shift.d', anything());
  });
});
