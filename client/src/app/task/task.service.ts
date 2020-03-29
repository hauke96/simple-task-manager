import { Injectable, EventEmitter } from '@angular/core';
import { Task } from './task.material';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public tasks: Task[] = [];
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();

  private selectedTaskId: string;

  constructor(private http: HttpClient) {
    this.http.get(environment.url_tasks).subscribe(data => {
      this.tasks = (data as Task[]);

      // Assign dome dummy users
      this.tasks[0].assignedUser = 'Peter';
      this.tasks[4].assignedUser = 'Maria';
      this.selectTask(this.tasks[0].id);
    });
  }

  public createNewTask(geometry: [[number, number]], maxProcessPoints: number): string {
    const task = new Task('t-' + Math.random().toString(36).substring(7), 0, maxProcessPoints, geometry);
    this.tasks.push(task);
    return task.id;
  }

  public selectTask(id: string) {
    this.selectedTaskId = id;
    this.selectedTaskChanged.emit(this.getSelectedTask());
  }

  public getSelectedTask(): Task {
    return this.getTask(this.selectedTaskId);
  }

  private getTask(id: string): Task {
    return this.tasks.find(t => t.id === id);
  }

  public getTasks(ids: string[]): Task[] {
    return this.tasks.filter(t => ids.includes(t.id));
  }

  public setProcessPoints(id: string, newProcessPoints: number) {
    this.getTask(id).processPoints = newProcessPoints;
    this.selectedTaskChanged.emit(this.getTask(id));
  }

  public assign(id: string, user: string) {
    this.getTask(id).assignedUser = user;
    this.selectedTaskChanged.emit(this.getTask(id));
  }

  public unassign(id: string) {
    this.getTask(id).assignedUser = undefined;
    this.selectedTaskChanged.emit(this.getTask(id));
  }
}
