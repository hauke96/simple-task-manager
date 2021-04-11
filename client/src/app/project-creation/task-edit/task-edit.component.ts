import { Component, Input, OnInit } from '@angular/core';
import { TaskDraft } from '../../task/task.material';
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
    const taskId = this.task.id;
    if (!taskId) {
      return;
    }

    this.taskDraftService.changeTaskName(taskId, enteredName);
  }
}
