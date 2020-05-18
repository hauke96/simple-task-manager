import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { ErrorService } from '../common/error.service';
import { Observable } from 'rxjs';
import { catchError, flatMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { User } from './user.material';
import { UserService } from './user.service';
import { ProjectService } from '../project/project.service';
import { Project } from '../project/project.material';

@Injectable({providedIn: 'root'})
export class UserResolver implements Resolve<User[]> {
  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private errorService: ErrorService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<User[]> {
    return this.projectService.getProject(route.paramMap.get('id')).pipe(
      flatMap((p: Project) =>
        this.userService.getUsersFromIds(p.users).pipe(
          catchError((e: HttpErrorResponse) => {
            this.errorService.addError('Could not load users of project');
            throw e;
          })
        )
      )
    );
  }
}
