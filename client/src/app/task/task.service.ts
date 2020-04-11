import { Injectable, EventEmitter } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';
import { Task } from './task.material';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();

  private selectedTask: Task;

  constructor(private http: HttpClient) { }

  public createNewTasks(geometries: [[number, number]][], maxProcessPoints: number): Observable<Task[]> {
    const tasks = geometries.map(g => new Task('', 0, maxProcessPoints, g));
    return this.http.post<Task[]>(environment.url_tasks, JSON.stringify(tasks));
  }

  public selectTask(task: Task) {
    this.selectedTask = task;
    this.selectedTaskChanged.emit(task);
  }

  public getSelectedTask(): Task {
    return this.selectedTask;
  }

  public setProcessPoints(id: string, newProcessPoints: number) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw new Error('Task with id \'' + id + '\' not selected');
    }

    this.http.post<Task>(environment.url_task_processPoints + '?id=' + id + '&process_points=' + newProcessPoints, '')
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public assign(id: string, user: string) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw new Error('Task with id \'' + id + '\' not selected');
    }

    this.http.post<Task>(environment.url_task_assignedUser + '?id=' + id, '')
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public unassign(id: string) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw new Error('Task with id \'' + id + '\' not selected');
    }

    this.http.delete<Task>(environment.url_task_assignedUser + '?id=' + id)
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }
}
