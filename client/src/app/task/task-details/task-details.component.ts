import { Component, Input, OnInit } from '@angular/core';
import { TaskService } from '../task.service';
import { Task } from '../task.material';
import { CurrentUserService } from '../../user/current-user.service';
import { ErrorService } from '../../common/error.service';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
  @Input() public projectId: string;
  @Input() public needUserAssignment: boolean;

  public task: Task;
  public newProcessPoints: number;

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private errorService: ErrorService,
  ) {
  }

  ngOnInit(): void {
    this.task = this.taskService.getSelectedTask();
    this.taskService.selectedTaskChanged.subscribe((task) => {
      this.task = task;
      this.newProcessPoints = task.processPoints;
    });
  }

  public get currentUserId(): string {
    return this.currentUserService.getUserId();
  }

  public onAssignButtonClicked() {
    // TODO do we need the user ID here?
    this.taskService.assign(this.task.id, this.currentUserService.getUserId())
      .subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.errorService.addError('Could not assign user');
        });
  }

  public onUnassignButtonClicked() {
    this.taskService.unassign(this.task.id)
      .subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.errorService.addError('Could not unassign user');
        });
  }

  public onSaveButtonClick() {
    this.taskService.setProcessPoints(this.task.id, this.newProcessPoints)
      .subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.errorService.addError('Could not set process points');
        });
  }

  public onOpenJosmButtonClicked() {
    this.taskService.openInJosm(this.task, this.projectId)
      .subscribe(() => {
        },
        err => {
          this.errorService.addError('Unable to open JOSM. Is it running?');
        });
  }
}
