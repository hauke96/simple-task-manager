import { Injectable, EventEmitter } from '@angular/core';
import { Task } from './task.material';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public tasks: Task[] = [];
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();

  private selectedTaskId: string;

  constructor() {
    let startY = 53.5484;
    let startX = 9.9714;
    
    for (let i = 0; i < 5;i++) {
      let geom = [];
      geom.push([startX, startY]);
      geom.push([startX + 0.01, startY]);
      geom.push([startX + 0.01, startY+0.01]);
      geom.push([startX, startY+0.01]);
      geom.push([startX, startY]);

      startX+=0.01;

      this.tasks.push(new Task("t"+i, 0, 100, geom as [[number, number]]));
    }
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
  }
}
