import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventManager } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ShortcutService {

  constructor(private eventManager: EventManager,
              @Inject(DOCUMENT) document: Document) {
  }

  /**
   * @param shortcutString A string defining the shortcut. E.g. "shift.d" should say that the "shift" and "d" key must be pressed.
   */
  add(shortcutString: string): Observable<void> {
    const eventString = `keydown.${shortcutString}`;

    return new Observable(observer => {
      const handler = (e: Event) => {
        e.preventDefault();
        observer.next();
      };

      const removeHandlerCallback = this.eventManager.addEventListener(
        document.documentElement, eventString, handler
      );

      return () => {
        removeHandlerCallback();
      };
    });
  }
}
