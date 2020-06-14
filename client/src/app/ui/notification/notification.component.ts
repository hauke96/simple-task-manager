import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../common/loading.service';
import { NotificationService } from '../../common/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit(): void {
  }

  public get isLoading(): boolean {
    return this.loadingService.loading;
  }

  //
  // Error
  //

  public get hasError(): boolean {
    return this.notificationService.hasError();
  }

  public get remainingErrors(): number{
    return this.notificationService.remainingErrors();
  }

  public get currentErrorText(): string {
    return this.notificationService.getError();
  }

  public onCloseErrorButtonClicked() {
    this.notificationService.dropError();
  }

  //
  // Warning
  //

  public get hasWarning(): boolean {
    return this.notificationService.hasWarning();
  }

  public get remainingWarning(): number{
    return this.notificationService.remainingWarning();
  }

  public get currentWarningText(): string {
    return this.notificationService.getWarning();
  }

  public onCloseWarningButtonClicked() {
    this.notificationService.dropWarning();
  }

  //
  // Info
  //

  public get hasInfo(): boolean {
    return this.notificationService.hasInfo();
  }

  public get remainingInfo(): number{
    return this.notificationService.remainingInfo();
  }

  public get currentInfoText(): string {
    return this.notificationService.getInfo();
  }

  public onCloseInfoButtonClicked() {
    this.notificationService.dropInfo();
  }
}
