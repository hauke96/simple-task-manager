import { Component, OnInit } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  private testError = 'Some error occured';

  constructor(
    private loadingService: LoadingService
  ) {
  }

  ngOnInit(): void {
  }

  public get isLoading(): boolean {
    return this.loadingService.loading;
  }

  public get hasError(): boolean {
    // TODO extract into service
    return true;
  }

  public get currentErrorText(): string {
    return this.testError;
  }

  public onCloseErrorButtonClicked() {
    this.testError += '#';
  }
}
