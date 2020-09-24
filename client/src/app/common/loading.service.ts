import { Injectable } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loading: boolean;

  constructor(private router: Router) {
    this.loading = false;

    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else if (event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError) {
        this.loading = false;
      }
    });
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public start() {
    this.loading = true;
  }

  public end() {
    this.loading = false;
  }
}
