import { ErrorHandler, Injectable } from '@angular/core';
import { NotificationService } from './common/services/notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private notificationService: NotificationService) {
  }

  handleError(error: any) {
    this.notificationService.addError('Unexcpected error occured: ' + error);
    console.error(error);
  }
}
