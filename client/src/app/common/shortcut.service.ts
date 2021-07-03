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

  // Ignore shortcuts on these node types
  private ignoredNodeNames = ['input', 'textarea', 'select', 'option'];

  /**
   * @param shortcutString A string defining the shortcut. E.g. "shift.d" should say that the "shift" and "d" key must be pressed.
   */
  add(shortcutString: string): Observable<void> {
    const eventString = `keydown.${shortcutString}`;

    return new Observable(observer => {
      const handler = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLElement && !this.ignoredNodeNames.includes(e.target.nodeName.toLowerCase())) {
          e.preventDefault();
          observer.next();
        }
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
