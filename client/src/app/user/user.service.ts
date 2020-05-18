import { Injectable } from '@angular/core';
import { User } from './user.material';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser?: User;

  // TODO changed event?

  constructor() {
  }

  public setUser(userName: string, uid: string) {
    this.currentUser = new User(userName, uid);
  }

  public resetUser() {
    this.currentUser = undefined;
  }

  public getUserName(): string {
    return this.currentUser ? this.currentUser.name : undefined;
  }

  public getUserId() {
    return this.currentUser ? this.currentUser.uid : undefined;
  }
}
