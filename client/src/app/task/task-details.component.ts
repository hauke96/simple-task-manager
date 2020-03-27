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

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.task = this.taskService.getSelectedTask();
    this.taskService.selectedTaskChanged.subscribe((task) => {
      this.task = task;
    });
  }
}
