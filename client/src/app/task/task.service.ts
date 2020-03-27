import { Injectable } from '@angular/core';
import { Task } from './task.material';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public tasks: Task[] = [];

  constructor() {
    this.tasks.push(new Task("t0", 40, 100));
    this.tasks.push(new Task("t1", 100, 100));
    this.tasks.push(new Task("t2", 10, 100));
  }

  public getTasks(id: string): Task[] {
    return this.tasks;
  }
}
