import { Component, OnInit, Input } from '@angular/core';
import { Task } from './task.material';
import { TaskService } from './task.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  @Input() projectId: string;

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
  }

  public get tasks() : Task[] {
    return this.taskService.getTasks(this.projectId);
  }
}
