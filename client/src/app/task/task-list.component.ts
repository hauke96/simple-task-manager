import { Component, OnInit } from '@angular/core';
import { Task } from './task.material';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  public tasks: Task[] = [];

  constructor() {
    this.tasks.push(new Task("t0", 40, 100));
    this.tasks.push(new Task("t1", 100, 100));
    this.tasks.push(new Task("t2", 10, 100));
  }

  ngOnInit(): void {
  }

}
