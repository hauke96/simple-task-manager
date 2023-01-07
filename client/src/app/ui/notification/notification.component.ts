import { Component } from '@angular/core';
import { LoadingService } from '../../common/services/loading.service';
import { NotificationService } from '../../common/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
  }

  public get isLoading(): boolean {
    return this.loadingService.isLoading();
  }

  //
  // Error
  //

  public get hasError(): boolean {
    return this.notificationService.hasError();
  }

  public get remainingErrors(): number {
    return this.notificationService.remainingErrors();
  }

  public get currentErrorText(): string | undefined {
    return this.notificationService.getError();
  }

  public onCloseErrorButtonClicked(): void {
    this.notificationService.dropError();
  }

  //
  // Warning
  //

  public get hasWarning(): boolean {
    return this.notificationService.hasWarning();
  }

  public get remainingWarning(): number {
    return this.notificationService.remainingWarning();
  }

  public get currentWarningText(): string | undefined {
    return this.notificationService.getWarning();
  }

  public onCloseWarningButtonClicked(): void {
    this.notificationService.dropWarning();
  }

  //
  // Info
  //

  public get hasInfo(): boolean {
    return this.notificationService.hasInfo();
  }

  public get remainingInfo(): number {
    return this.notificationService.remainingInfo();
  }

  public get currentInfoText(): string | undefined {
    return this.notificationService.getInfo();
  }

  public onCloseInfoButtonClicked(): void {
    this.notificationService.dropInfo();
  }
}
