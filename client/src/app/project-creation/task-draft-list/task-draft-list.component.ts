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
  @Input() public selectedTask: TaskDraft | undefined;

  constructor(
    private taskDraftService: TaskDraftService
  ) {
  }

  public onTaskClicked(id: string): void {
    this.taskDraftService.selectTask(id);
  }
}
