import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../common/loading.service';
import { ErrorService } from '../common/error.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  constructor(
    private loadingService: LoadingService,
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
  }

  public get isLoading(): boolean {
    return this.loadingService.loading;
  }

  public get hasError(): boolean {
    return this.errorService.hasError();
  }

  public get currentErrorText(): string {
    return this.errorService.getError();
  }

  public onCloseErrorButtonClicked() {
    this.errorService.dropError();
  }
}
