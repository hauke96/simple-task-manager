import { ErrorHandler, Injectable } from '@angular/core';
import { NotificationService } from './common/notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private notificationService: NotificationService) {
  }

  handleError(error: string) {
    this.notificationService.addError('Unexcpected error occured: ' + error);
  }
}
