import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { TaskService } from '../../task/task.service';
import { Project } from '../project.material';
import { CurrentUserService } from '../../user/current-user.service';
import { NotificationService } from '../../common/services/notification.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { User } from '../../user/user.material';
import { TranslateService } from '@ngx-translate/core';
import { Task } from '../../task/task.material';
import { TabsComponent } from '../../ui/tabs/tabs.component';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent extends Unsubscriber implements OnInit {
  public project: Project;

  @ViewChild('innerTabs')
  public innerTabControl: TabsComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private notificationService: NotificationService,
    private translationService: TranslateService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    super();

    this.project = this.route.snapshot.data.project;
  }

  ngOnInit(): void {
    this.taskService.selectTask(this.project.tasks[0]);

    this.unsubscribeLater(
      this.projectService.projectChanged.subscribe(p => {
        this.project = p;
        // Force change detection for the case that the comments of the current selected task are visible. In this case, changes in the
        // comments of the selected task are not registered (probably) because changes only happened in the comment component and task
        // service but not within this component or any above this.
        this.changeDetectorRef.detectChanges();
      }),
      this.projectService.projectDeleted.subscribe(removedProjectId => {
        if (this.project.id !== removedProjectId) {
          return;
        }

        if (!this.isOwner()) {
          const message = this.translationService.instant('project-has-been-removed', {projectName: this.project.name}) as string;
          this.notificationService.addInfo(message);
        }

        void this.router.navigate(['/dashboard']);
      }),
      this.projectService.projectUserRemoved.subscribe(projectId => {
        if (this.project.id !== projectId) {
          return;
        }

        const message = this.translationService.instant('you-have-been-removed', {projectName: this.project.name}) as string;
        this.notificationService.addInfo(message);
        void this.router.navigate(['/dashboard']);
      })
    );
  }

  public get tabTitles(): string[] {
    return [
      this.translationService.instant('project.tab-titles.tasks') as string,
      this.translationService.instant('project.tab-titles.comments') as string,
      this.translationService.instant('project.tab-titles.users') as string,
      this.translationService.instant('project.tab-titles.settings') as string
    ];
  }

  public get innerTabTitles(): string[] {
    return [
      this.translationService.instant('project.tab-titles.list') as string,
      this.translationService.instant('project.tab-titles.comments') as string
    ];
  }

  public get selectedTask(): Task | undefined {
    return this.taskService.getSelectedTask();
  }

  public onUserRemoved(userIdToRemove: string): void {
    this.projectService.removeUser(this.project.id, userIdToRemove)
      .subscribe({
        next: () => {
        },
        error: err => {
          console.error(err);
          this.notificationService.addError(this.translationService.instant('project.could-not-remove-user'));
        }
      });
  }

  public onUserInvited(user: User): void {
    this.projectService.inviteUser(this.project.id, user.uid)
      .subscribe({
        next: () => {
        },
        error: err => {
          console.error(err);
          this.notificationService.addError(this.translationService.instant('project.could-not-invite-user', {userName: user.name}));
        }
      });
  }

  public onTaskCommentSelected(task: Task): void {
    this.taskService.selectTask(task);
    this.innerTabControl.selectTab(1);
  }

  public onProjectCommentSendClicked(comment: string): void {
    this.projectService.addComment(this.project.id, comment)
      .subscribe({
        next: () => {
        },
        error: err => {
          console.error(err);
          const message = this.translationService.instant('project.could-not-add-task-comment');
          this.notificationService.addError(message);
        }
      });
  }

  public onTaskCommentSendClicked(taskId: string | undefined, comment: string): void {
    if (!taskId) {
      return;
    }

    this.taskService.addComment(taskId, comment)
      .subscribe({
        error: e => {
          console.error(e);
          const message = this.translationService.instant('project.could-not-add-task-comment');
          this.notificationService.addError(message);
        }
      });
  }

  public isOwner(): boolean {
    return this.currentUserService.getUserId() === this.project.owner.uid;
  }
}
