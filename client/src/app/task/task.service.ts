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
  public tasks: Task[] = [];

  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();

  private selectedTask: Task;

  constructor(private http: HttpClient) {
  }

  public createNewTasks(geometries: [[number, number]][], maxProcessPoints: number): Observable<Task[]> {
    const tasks = geometries.map(g => new Task('', 0, maxProcessPoints, g));
    return this.http.post<Task[]>(environment.url_tasks, JSON.stringify(tasks))
      .pipe(map(t => {
        this.tasks.concat(t);
        return t;
      })
    );
  }

  public selectTask(task: Task) {
    this.selectedTask = task;
    this.selectedTaskChanged.emit(task);
  }

  public getSelectedTask(): Task {
    return this.selectedTask;
  }

  public getTask(id: string): Observable<Task> {
    const localTask = this.tasks.filter(t => t.id === id)
    if (!!localTask && localTask.length > 0) {
      return of(localTask[0]);
    }

    return this.getTasks([id])
      .pipe(map(t => t.find(t => t.id === id)));
  }

  public getTasks(ids: string[]): Observable<Task[]> {
    const idsString = ids.join(',');
    return this.http.get<Task[]>(environment.url_tasks + "?task_ids=" + idsString).pipe(map(tasks => {
      tasks.concat(this.tasks);
      return tasks;
    }));
  }

  public setProcessPoints(id: string, newProcessPoints: number) {
    this.http.post<Task>(environment.url_task_processPoints + '?id=' + id + '&process_points=' + newProcessPoints)
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public assign(id: string, user: string) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw 'Task with id \'' + id + '\' not selected';
    }

    this.http.post<Task>(environment.url_task_assignedUser + '?id=' + id, '')
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public unassign(id: string) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw 'Task with id \'' + id + '\' not selected';
    }

    this.http.delete<Task>(environment.url_task_assignedUser + '?id=' + id)
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }
}
