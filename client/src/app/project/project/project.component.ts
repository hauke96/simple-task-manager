import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { TaskService } from '../../task/task.service';
import { Project } from '../project.material';
import { CurrentUserService } from '../../user/current-user.service';
import { UserService } from '../../user/user.service';
import { NotificationService } from '../../common/services/notification.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { User } from '../../user/user.material';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent extends Unsubscriber implements OnInit {
  public project: Project;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private notificationService: NotificationService
  ) {
    super();

    this.project = this.route.snapshot.data.project;
  }

  ngOnInit(): void {
    this.taskService.selectTask(this.project.tasks[0]);

    this.unsubscribeLater(
      this.projectService.projectChanged.subscribe(p => {
        this.project = p;
      }),
      this.projectService.projectDeleted.subscribe(removedProjectId => {
        if (this.project.id !== removedProjectId) {
          return;
        }

        if (!this.isOwner()) {
          this.notificationService.addInfo($localize`:@@WARN_PROJECT_REMOVED:The project '${this.project.name}:INTERPOLATION:' has been removed`);
        }

        this.router.navigate(['/dashboard']);
      }),
      this.projectService.projectUserRemoved.subscribe(projectId => {
        if (this.project.id !== projectId) {
          return;
        }

        this.notificationService.addInfo($localize`:@@WARN_REMOVED_USER_PROJECT:You have been removed from project '${this.project.name}:INTERPOLATION:'`);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  public get tabTitles(): string[] {
    return [
      $localize`:@@TABS_TASKS:Tasks`,
      $localize`:@@TABS_USERS:Users`,
      $localize`:@@TABS_SETTINGS:Settings`
    ];
  }

  public onUserRemoved(userIdToRemove: string) {
    this.projectService.removeUser(this.project.id, userIdToRemove)
      .subscribe(() => {
      }, err => {
        console.error(err);
        this.notificationService.addError($localize`:@@ERROR_NOT_REMOVE_USER:Could not remove user`);
      });
  }

  public onUserInvited(user: User) {
    this.projectService.inviteUser(this.project.id, user.uid)
      .subscribe(() => {
      }, err => {
        console.error(err);
        this.notificationService.addError($localize`:@@ERROR_NOT_INVITE_USER:Could not invite user '${user.name}:INTERPOLATION:'`);
      });
  }

  public isOwner(): boolean {
    return this.currentUserService.getUserId() === this.project.owner.uid;
  }
}
