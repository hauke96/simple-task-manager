import { Component, Input, OnInit } from '@angular/core';
import { TaskService } from './task.service';
import { Task } from './task.material';
import { UserService } from '../user/user.service';
import { ErrorService } from '../common/error.service';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit {
  @Input() public needUserAssignment: boolean;

  public task: Task;
  public newProcessPoints: number;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
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

  public get currentUser(): string {
    return this.userService.getUser();
  }

  public onAssignButtonClicked() {
    this.taskService.assign(this.task.id, this.userService.getUser())
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
    this.taskService.openInJosm(this.task)
      .subscribe(() => {
        },
        err => {
          this.errorService.addError('Unable to open JOSM. Is it running?');
        });
  }
}
