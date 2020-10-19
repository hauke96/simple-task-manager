import { Component, Input, OnInit } from '@angular/core';
import { TaskDraft } from '../task-draft';
import { TaskDraftService } from '../task-draft.service';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss']
})
export class TaskEditComponent implements OnInit {
  @Input() task: TaskDraft;

  constructor(
    private taskDraftService: TaskDraftService
  ) {
  }

  ngOnInit(): void {
  }

  onTaskNameChanged(enteredName: any) {
    this.taskDraftService.changeTaskName(this.task.id, enteredName);
  }
}
