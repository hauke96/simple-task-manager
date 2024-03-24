import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../common/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from './task.service';
import { Task } from './task.material';

export const taskResolver: ResolveFn<Task> = (route: ActivatedRouteSnapshot, _) => {
  const taskService = inject(TaskService);
  const notificationService = inject(NotificationService);
  const translateService = inject(TranslateService);

  if (!route.paramMap.has('id')) {
    return of();
  }

  // @ts-ignore
  return taskService.getTask(route.paramMap.get('id')).pipe(
    catchError((e: HttpErrorResponse) => {
      const message = translateService.instant('task.could-not-load-task', {taskId: route.paramMap.get('id')});
      notificationService.addError(message);
      throw e;
    })
  );
};
