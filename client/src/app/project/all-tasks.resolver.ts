import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Task } from '../task/task.material';
import { ProjectService } from './project.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../common/error.service';

@Injectable({providedIn: 'root'})
export class AllTasksResolver implements Resolve<Task[]> {
  constructor(
    private projectService: ProjectService,
    private errorService: ErrorService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Task[]> {
    return this.projectService.getTasks(route.paramMap.get('id')).pipe(
      catchError((e: HttpErrorResponse) => {
        this.errorService.addError('Could not load tasks');
        throw e;
      })
    );
  }
}
