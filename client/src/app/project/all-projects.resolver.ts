import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Project } from './project.material';
import { ProjectService } from './project.service';
import { Observable } from 'rxjs';
import { catchError, share, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../common/notification.service';

@Injectable({providedIn: 'root'})
export class AllProjectsResolver implements Resolve<Project[]> {
  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project[]> {
    return this.projectService.getProjects().pipe(
      catchError((e: HttpErrorResponse) => {
        this.notificationService.addError($localize`:@@ERROR_LOAD_PROJECTS:Could not load projects`);
        throw e;
      })
    );
  }
}
