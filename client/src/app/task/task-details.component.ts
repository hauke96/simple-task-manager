import { Component, OnInit } from '@angular/core';
import { TaskService } from './task.service';
import { Task } from './task.material';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
  public task: Task;

  public newProcessPoints: number;

  public test: string;

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.task = this.taskService.getSelectedTask();
    this.newProcessPoints = this.task.processPoints;
    this.taskService.selectedTaskChanged.subscribe((task) => {
      this.task = task;
    });
  }

  public onSaveButtonClick() {
    this.taskService.setProcessPoints(this.task.id, this.newProcessPoints);
  }
}
