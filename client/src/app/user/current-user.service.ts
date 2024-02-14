import { Injectable } from '@angular/core';
import { User } from './user.material';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {
  private currentUser?: User;
  private $userChanged: Subject<User | undefined> = new Subject<User | undefined>();

  constructor() {
  }

  get onUserChanged(): Observable<User | undefined> {
    return this.$userChanged.asObservable();
  }

  public setUser(userName: string, uid: string): void {
    this.currentUser = new User(userName, uid);
    this.$userChanged.next(this.currentUser);
  }

  public resetUser(): void {
    this.currentUser = undefined;
    this.$userChanged.next(undefined);
  }

  public getUserName(): string | undefined {
    return this.currentUser?.name;
  }

  public getUserId(): string | undefined {
    return this.currentUser?.uid;
  }
}
