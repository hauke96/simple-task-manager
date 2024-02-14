import { Component, Input, OnInit } from '@angular/core';
import { TaskService } from '../task.service';
import { Task } from '../task.material';
import { CurrentUserService } from '../../user/current-user.service';
import { NotificationService } from '../../common/services/notification.service';
import { User } from '../../user/user.material';
import { UserService } from '../../user/user.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { ShortcutService } from '../../common/services/shortcut.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent extends Unsubscriber implements OnInit {
  @Input() public projectId: string;
  @Input() public projectOwnerId: string;
  @Input() public needUserAssignment: boolean;

  public task?: Task;
  public newProcessPoints: number;
  public assignedUserName?: string;

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private userService: UserService,
    private notificationService: NotificationService,
    private shortcutService: ShortcutService,
    private translationService: TranslateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.selectTask(this.taskService.getSelectedTask());
    this.unsubscribeLater(
      this.taskService.selectedTaskChanged.subscribe((task: Task) => {
        this.selectTask(task);
      }),
      this.shortcutService.add('a').subscribe(() => {
        // we need assignment on tasks  AND  no user assigned
        if (this.needUserAssignment && !this.task?.assignedUser) {
          this.onAssignButtonClicked();
        }
      }),
      this.shortcutService.add('shift.a').subscribe(() => {
        // we need assignment on tasks  AND  current user is assigned
        if (this.needUserAssignment
          && !!this.task?.assignedUser
          && this.task?.assignedUser.uid === this.currentUserId
        ) {
          this.onUnassignButtonClicked();
        }
      }),
      this.shortcutService.add('d').subscribe(() => {
        // task not done  AND  ( we don't need assignment  OR  current user is assigned )
        if (!this.task?.isDone
          && (!this.needUserAssignment || !!this.task?.assignedUser && this.task.assignedUser.uid === this.currentUserId)
        ) {
          this.onDoneButtonClick();
        }
      }),
      this.shortcutService.add('j').subscribe(() => {
        this.onOpenJosmButtonClicked();
      }),
      this.shortcutService.add('i').subscribe(() => {
        this.onOpenOsmOrgButtonClicked();
      })
    );
  }

  private selectTask(task: Task | undefined): void {
    this.task = task;
    if (!!task) {
      this.newProcessPoints = task.processPoints;
    }
    this.updateUser();
  }

  public get currentUserId(): string | undefined {
    return this.currentUserService.getUserId();
  }

  public get currentUserIsProjectOwner(): boolean {
    return this.projectOwnerId === this.currentUserService.getUserId();
  }

  private updateUser(): void {
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
        this.notificationService.addError(this.translationService.instant('task-details.unable-load-assigned-user'));
      }
    );
  }

  public onAssignButtonClicked(): void {
    if (!this.task) {
      return;
    }

    this.taskService.assign(this.task.id)
      .subscribe({
        error: e => {
          console.error(e);
          this.notificationService.addError(this.translationService.instant('task-details.unable-assign-user'));
        }
      });
  }

  public onUnassignButtonClicked(): void {
    if (!this.task) {
      return;
    }

    this.taskService.unassign(this.task.id)
      .subscribe({
        error: e => {
          console.error(e);
          this.notificationService.addError(this.translationService.instant('task-details.unable-unassign-user'));
        }
      });
  }

  public onSaveButtonClick(): void {
    if (!this.task) {
      return;
    }

    this.taskService.setProcessPoints(this.task.id, this.newProcessPoints)
      .subscribe({
        error: e => {
          console.error(e);
          this.notificationService.addError(this.translationService.instant('task-details.unable-set-process-points'));
        }
      });
  }

  public onDoneButtonClick(): void {
    if (!this.task) {
      return;
    }

    this.taskService.setProcessPoints(this.task.id, this.task.maxProcessPoints)
      .subscribe({
        error: e => {
          console.error(e);
          this.notificationService.addError(this.translationService.instant('task-details.unable-set-process-points'));
        }
      });
  }

  public onOpenJosmButtonClicked(): void {
    if (!this.task) {
      return;
    }

    this.taskService.openInJosm(this.task)
      .subscribe({
        error: err => {
          console.error('Error opening JOSM:', err);
          this.notificationService.addError(this.translationService.instant('task-details.unable-load-josm') + ' ' + err);
        }
      });
  }

  public onOpenOsmOrgButtonClicked(): void {
    if (!this.task) {
      return;
    }

    this.taskService.openInOsmOrg(this.task, this.projectId);
  }
}
