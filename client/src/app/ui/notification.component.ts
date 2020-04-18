import { Component, OnInit } from '@angular/core';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {

  constructor(
    private loadingService: LoadingService
  ) {
  }

  ngOnInit(): void {
  }

  public get isLoading(): boolean {
    return this.loadingService.loading;
  }
}
