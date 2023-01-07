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
import { TranslateService } from '@ngx-translate/core';

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
    private notificationService: NotificationService,
    private translationService: TranslateService
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
          this.notificationService.addInfo(this.translationService.instant('project-has-been-removed', {projectName: this.project.name}));
        }

        this.router.navigate(['/dashboard']);
      }),
      this.projectService.projectUserRemoved.subscribe(projectId => {
        if (this.project.id !== projectId) {
          return;
        }

        this.notificationService.addInfo(this.translationService.instant('you-have-been-removed', {projectName: this.project.name}));
        this.router.navigate(['/dashboard']);
      })
    );
  }

  public get tabTitles(): string[] {
    return [
      this.translationService.instant('project.tab-titles.tasks'),
      this.translationService.instant('project.tab-titles.users'),
      this.translationService.instant('project.tab-titles.settings')
    ];
  }

  public onUserRemoved(userIdToRemove: string): void {
    this.projectService.removeUser(this.project.id, userIdToRemove)
      .subscribe(() => {
      }, err => {
        console.error(err);
        this.notificationService.addError(this.translationService.instant('project.could-not-remove-user'));
      });
  }

  public onUserInvited(user: User): void {
    this.projectService.inviteUser(this.project.id, user.uid)
      .subscribe(() => {
      }, err => {
        console.error(err);
        this.notificationService.addError(this.translationService.instant('project.could-not-invite-user', {userName: user.name}));
      });
  }

  public isOwner(): boolean {
    return this.currentUserService.getUserId() === this.project.owner.uid;
  }
}
