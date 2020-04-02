import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TaskService } from './task.service';
import { Task } from './task.material';
import { UserService } from '../auth/user.service';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
  public task: Task;
  public newProcessPoints: number;

  constructor(
    private taskService: TaskService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.taskService.selectedTaskChanged.subscribe((task) => {
      this.task = task;
      this.newProcessPoints = task.processPoints;
    });
  }

  public get currentUser(): string {
    return this.userService.getUser();
  }

  public onAssignButtonClicked() {
    this.taskService.assign(this.task.id, this.userService.getUser());
  }

  public onUnassignButtonClicked() {
    this.taskService.unassign(this.task.id);
  }

  public onSaveButtonClick() {
    this.taskService.setProcessPoints(this.task.id, this.newProcessPoints);
  }
}
