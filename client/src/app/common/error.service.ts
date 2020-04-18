import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errors: Array<string>;

  constructor() {
    this.errors = new Array<string>();
  }

  public hasError(): boolean {
    return this.errors.length !== 0;
  }

  // Returns the oldest error
  public getError(): string {
    return this.errors[0];
  }

  // Drops/removes the oldest error reported by "getError()"
  public dropError() {
    this.errors.shift();
  }
}
