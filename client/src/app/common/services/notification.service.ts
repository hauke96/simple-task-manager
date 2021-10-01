import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private errorMessages: Array<string>;
  private infoMessages: Array<string>;
  private warningMessages: Array<string>;

  constructor() {
    this.errorMessages = new Array<string>();
    this.infoMessages = new Array<string>();
    this.warningMessages = new Array<string>();
  }

  //
  // Errors
  //

  public hasError(): boolean {
    return this.errorMessages.length !== 0;
  }

  public remainingErrors() {
    return this.errorMessages.length;
  }

  // Returns the oldest message
  public getError(): string | undefined {
    return this.errorMessages[0];
  }

  // Drops/removes the oldest error reported by "getError()"
  public dropError() {
    this.errorMessages.shift();
  }

  public addError(message: string) {
    this.errorMessages.push(message);
  }

  //
  // Info
  //

  public hasInfo(): boolean {
    return this.infoMessages.length !== 0;
  }

  public remainingInfo() {
    return this.infoMessages.length;
  }

  // Returns the oldest message
  public getInfo(): string | undefined {
    return this.infoMessages[0];
  }

  // Drops/removes the oldest error reported by "dropInfo()"
  public dropInfo() {
    this.infoMessages.shift();
  }

  public addInfo(message: string) {
    this.infoMessages.push(message);
  }

  //
  // Warning
  //

  public hasWarning(): boolean {
    return this.warningMessages.length !== 0;
  }

  public remainingWarning() {
    return this.warningMessages.length;
  }

  // Returns the oldest message
  public getWarning(): string | undefined {
    return this.warningMessages[0];
  }

  // Drops/removes the oldest error reported by "getWarning()"
  public dropWarning() {
    this.warningMessages.shift();
  }

  public addWarning(message: string) {
    this.warningMessages.push(message);
  }
}
