import { TestBed } from '@angular/core/testing';

import { ShortcutService } from './shortcut.service';
import { EventManager } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import anything = jasmine.anything;

describe('ShortcutService', () => {
  let service: ShortcutService;
  let eventManager: EventManager;
  let document: Document;

  beforeEach(() => {
    document = {documentElement: {}} as any;

    TestBed.configureTestingModule({
      providers: [
        {provide: DOCUMENT, useValue: document},
      ]
    });
    service = TestBed.inject(ShortcutService);

    eventManager = TestBed.inject(EventManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call event manager', () => {
    const eventManagerSpy = spyOn(eventManager, 'addEventListener').and.returnValue(new Function());

    service.add('shift.d').subscribe();

    expect(eventManagerSpy).toHaveBeenCalledWith(document.documentElement, 'keydown.shift.d', anything());
  });
});
