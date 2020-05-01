import { of } from 'rxjs';

export class MockRouter {
  navigate(commands: any[]) {
    return of(true).toPromise();
  }
}
