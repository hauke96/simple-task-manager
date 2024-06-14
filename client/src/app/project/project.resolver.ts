import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Project } from './project.material';
import { ProjectService } from './project.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../common/services/notification.service';
import { TranslateService } from '@ngx-translate/core';

export const projectResolver: ResolveFn<Project> = (route: ActivatedRouteSnapshot, _) => {
  const projectService = inject(ProjectService);
  const notificationService = inject(NotificationService);
  const translateService = inject(TranslateService);

  if (!route.paramMap.has('id')) {
    return of();
  }

  // @ts-ignore
  return projectService.getProject(route.paramMap.get('id')).pipe(
    catchError((e: HttpErrorResponse) => {
      const message = translateService.instant('project.could-not-load-project', {projectId: route.paramMap.get('id')});
      notificationService.addError(message);
      throw e;
    })
  );
};
