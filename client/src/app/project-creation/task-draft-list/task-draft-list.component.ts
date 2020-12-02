import { Component, Input } from '@angular/core';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';

@Component({
  selector: 'app-task-draft-list',
  templateUrl: './task-draft-list.component.html',
  styleUrls: ['./task-draft-list.component.scss']
})
export class TaskDraftListComponent {
  @Input() public tasks: TaskDraft[];
  @Input() public selectedTask: TaskDraft;

  constructor(
    private taskDraftService: TaskDraftService
  ) {
  }

  onTaskClicked(id: string) {
    this.taskDraftService.selectTask(id);
  }
}
