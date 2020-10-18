import { Component, Input, OnInit } from '@angular/core';
import { TaskDraft } from '../task-draft';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss']
})
export class TaskEditComponent implements OnInit {
  @Input() task: TaskDraft;

  constructor() { }

  ngOnInit(): void {
  }

}
