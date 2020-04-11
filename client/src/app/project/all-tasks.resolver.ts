import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Task } from '../task/task.material';
import { ProjectService } from './project.service';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class AllTasksResolver implements Resolve<Task[]> {
  constructor(
    private projectService: ProjectService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Task[]> {
    return this.projectService.getTasks(route.paramMap.get('id'));
  }
}
