import { Injectable } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  public loading: boolean;

  constructor(private router: Router) {
    router.events.subscribe(event => {
      this.loading = event instanceof NavigationStart &&
        !(
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        );
    });
  }
}
