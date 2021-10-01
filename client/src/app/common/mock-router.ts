import { Observable, of } from 'rxjs';
import { Event } from '@angular/router';

export class MockRouter {
  public events = new Observable<Event>();

  navigate(commands: any[]): Promise<boolean | undefined> {
    return of(true).toPromise();
  }

  navigateByUrl(url: string): Promise<boolean | undefined> {
    return of(true).toPromise();
  }
}
