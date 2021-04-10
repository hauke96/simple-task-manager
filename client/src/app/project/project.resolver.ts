import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Project } from './project.material';
import { ProjectService } from './project.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../common/notification.service';

@Injectable({providedIn: 'root'})
export class ProjectResolver implements Resolve<Project> {
  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project> {
    if (!route.paramMap.has('id')) {
      return of();
    }

    // @ts-ignore
    return this.projectService.getProject(route.paramMap.get('id')).pipe(
      catchError((e: HttpErrorResponse) => {
        this.notificationService.addError($localize`:@@ERROR_NOT_LOAD_PROJ:Could not load project '${route.paramMap.get('id')}:INTERPOLATION:'`);
        throw e;
      })
    );
  }
}
