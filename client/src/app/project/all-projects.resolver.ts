import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Project } from './project.material';
import { ProjectService } from './project.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../common/error.service';

@Injectable({providedIn: 'root'})
export class AllProjectsResolver implements Resolve<Project[]> {
  constructor(
    private projectService: ProjectService,
    private errorService: ErrorService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project[]> {
    return this.projectService.getProjects().pipe(
      catchError((e: HttpErrorResponse) => {
        this.errorService.addError('Could not load projects');
        throw e;
      })
    );
  }
}
