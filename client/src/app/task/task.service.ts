import { Injectable, EventEmitter } from '@angular/core';
import { Observable, throwError } from 'rxjs';
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
    // TODO server call
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

  private getTask(id: string): Observable<Task> {
    return this.getTasks([id])
      .pipe(map(t => t.find(t => t.id === id)))
      .pipe(
        catchError(e => {
          console.error(e);
          return throwError("err");
        })
      );
  }

  public getTasks(ids: string[]): Observable<Task[]> {
    const idsString = ids.join(',');
    return this.http.get<Task[]>(environment.url_tasks + "?task_ids=" + idsString).pipe(map(tasks => {
      tasks.concat(this.tasks);
      return tasks;
    }));
  }

  public setProcessPoints(id: string, newProcessPoints: number) {
    // TODO Call server and receive updated task
    this.getTask(id).subscribe(t => {
      t.processPoints = newProcessPoints; // TODO remove after server call implemented
      this.selectedTaskChanged.emit(t);
    });
  }

  public assign(id: string, user: string) {
    // TODO Call server and receive updated task
    this.getTask(id).subscribe(t => {
      t.assignedUser = user; // TODO remove after server call implemented
      this.selectedTaskChanged.emit(t);
    });
  }

  public unassign(id: string) {
    // TODO Call server and receive updated task
    this.getTask(id).subscribe(t => {
      t.assignedUser = undefined; // TODO remove after server call implemented
      this.selectedTaskChanged.emit(t);
    });
  }
}
