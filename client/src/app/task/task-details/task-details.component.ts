import { Component, Input, OnInit } from '@angular/core';
import { TaskService } from '../task.service';
import { Task } from '../task.material';
import { CurrentUserService } from '../../user/current-user.service';
import { NotificationService } from '../../common/notification.service';
import { User } from '../../user/user.material';
import { UserService } from '../../user/user.service';
import { Unsubscriber } from '../../common/unsubscriber';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent extends Unsubscriber implements OnInit {
  @Input() public projectId: string;
  @Input() public needUserAssignment: boolean;

  public task: Task;
  public newProcessPoints: number;
  public assignedUserName: string;

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private userService: UserService,
    private notificationService: NotificationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.selectTask(this.taskService.getSelectedTask());
    this.unsubscribeLater(
      this.taskService.selectedTaskChanged.subscribe((task: Task) => {
        this.selectTask(task);
      })
    );
  }

  private selectTask(task: Task) {
    this.task = task;
    if (!!this.task) {
      this.newProcessPoints = task.processPoints;
    }
    this.updateUser();
  }

  public get currentUserId(): string {
    return this.currentUserService.getUserId();
  }

  private updateUser() {
    if (!this.task || !this.task.assignedUser || !this.task.assignedUser.uid) {
      this.assignedUserName = undefined;
      return;
    }

    this.userService.getUsersByIds([this.task.assignedUser.uid]).subscribe(
      (users: User[]) => {
        this.assignedUserName = users[0].name;
      },
      e => {
        console.error(e);
        this.notificationService.addError('Unable to load assigned user');
      }
    );
  }

  public onAssignButtonClicked() {
    this.taskService.assign(this.task.id)
      .subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.notificationService.addError('Could not assign user');
        });
  }

  public onUnassignButtonClicked() {
    this.taskService.unassign(this.task.id)
      .subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.notificationService.addError('Could not unassign user');
        });
  }

  public onSaveButtonClick() {
    this.taskService.setProcessPoints(this.task.id, this.newProcessPoints)
      .subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.notificationService.addError('Could not set process points');
        });
  }

  public onOpenJosmButtonClicked() {
    this.taskService.openInJosm(this.task, this.projectId)
      .subscribe(() => {
        },
        err => {
          this.notificationService.addError('Unable to open JOSM. Is it running?');
        });
  }
}
