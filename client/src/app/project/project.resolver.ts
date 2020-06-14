import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
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
    private notificationService: NotificationService,
    private router: Router
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project> {
    // When the project is already set via the router state (e.g. when the user clicked on a project in the project list), then use that
    // project and prevent additional server calls
    const navigationState = this.router.getCurrentNavigation().extras.state;
    if (navigationState && navigationState.project) {
      return of(navigationState.project);
    }

    return this.projectService.getProject(route.paramMap.get('id')).pipe(
      catchError((e: HttpErrorResponse) => {
        this.notificationService.addError('Could not load project \'' + route.paramMap.get('id') + '\'');
        throw e;
      })
    );
  }
}
