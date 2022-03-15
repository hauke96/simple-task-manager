import { Injectable } from '@angular/core';
import { User } from './user.material';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {
  private currentUser?: User;

  // TODO changed event?

  constructor() {
  }

  public setUser(userName: string, uid: string): void {
    this.currentUser = new User(userName, uid);
  }

  public resetUser(): void {
    this.currentUser = undefined;
  }

  public getUserName(): string | undefined {
    return this.currentUser?.name;
  }

  public getUserId(): string | undefined {
    return this.currentUser?.uid;
  }
}
