import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser?: string;

  // TODO changed event?

  constructor() {
  }

  public setUser(user: string) {
    this.currentUser = user;
  }

  public resetUser() {
    this.currentUser = undefined;
  }

  public getUser(): string {
    return this.currentUser;
  }
}
