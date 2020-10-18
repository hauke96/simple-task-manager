import { Component, Input } from '@angular/core';
import { TaskDraft } from '../task-draft';

@Component({
  selector: 'app-task-draft-list',
  templateUrl: './task-draft-list.component.html',
  styleUrls: ['./task-draft-list.component.scss']
})
export class TaskDraftListComponent {
  @Input() public tasks: TaskDraft[];
  @Input() public selectedTask: TaskDraft;

  constructor() { }
}
