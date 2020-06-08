import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

export class Unsubscriber implements OnDestroy {
  private subscriptions: Subscription[] = [];

  public unsubscribeLater(...subject: Subscription[]) {
    this.subscriptions.push(...subject);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
  }
}
