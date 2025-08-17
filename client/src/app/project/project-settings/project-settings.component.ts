import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../project.service';
import { Router } from '@angular/router';
import { CurrentUserService } from '../../user/current-user.service';
import { NotificationService } from '../../common/services/notification.service';
import { User } from '../../user/user.material';
import { TranslateService } from '@ngx-translate/core';
import { JosmDataSource } from '../../common/entities/josm-data-source';

@Component({
    selector: 'app-project-settings',
    templateUrl: './project-settings.component.html',
    styleUrls: ['./project-settings.component.scss'],
    standalone: false
})
export class ProjectSettingsComponent implements OnInit {
  @Input() projectId: string;
  @Input() projectOwner: User;
  @Input() projectName: string;
  @Input() projectDescription: string;
  @Input() projectJosmDataSource: JosmDataSource;

  public newProjectName: string;
  public newJosmDataSource: JosmDataSource;
  public newProjectDescription: string;

  public requestConfirmation: boolean;

  private action = '';

  constructor(
    private projectService: ProjectService,
    private currentUserService: CurrentUserService,
    private notificationService: NotificationService,
    private router: Router,
    private translationService: TranslateService
  ) {
  }

  ngOnInit(): void {
    // The owner cannot leave but only delete a project.
    // A normal member cannot delete a project but leave it.
    this.action = this.isOwner ? 'delete' : 'leave';
    this.newProjectName = this.projectName;
    this.newProjectDescription = this.projectDescription;
    this.newJosmDataSource = this.projectJosmDataSource;
  }

  public get isOwner(): boolean {
    return this.currentUserService.getUserId() === this.projectOwner.uid;
  }

  public onDeleteButtonClicked(): void {
    this.requestConfirmation = true;
  }

  public onLeaveProjectClicked(): void {
    this.requestConfirmation = true;
  }

  public onNoButtonClicked(): void {
    this.requestConfirmation = false;
  }

  public onYesButtonClicked(): void {
    if (this.action === 'delete') {
      this.deleteProject();
    } else if (this.action === 'leave') {
      this.leaveProject();
    }
  }

  private deleteProject(): void {
    this.projectService.deleteProject(this.projectId)
      .subscribe({
        next: () => {
          this.requestConfirmation = false;
          this.notificationService.addInfo(this.translationService.instant('project-settings.successfully-removed'));
          void this.router.navigate(['/dashboard']);
        },
        error: err => {
          console.error(err);
          this.notificationService.addError(this.translationService.instant('project-settings.could-not-remove-project'));
          this.requestConfirmation = false;
        }
      });
  }

  private leaveProject(): void {
    this.projectService.leaveProject(this.projectId)
      .subscribe({
        next: () => {
          this.requestConfirmation = false;
          void this.router.navigate(['/dashboard']);
        }, error: err => {
          console.error(err);
          this.notificationService.addError(this.translationService.instant('project-settings.could-not-leave-project'));
          this.requestConfirmation = false;
        }
      });
  }

  onSaveButtonClicked(): void {
    this.projectService.update(this.projectId, this.newProjectName, this.newProjectDescription, this.newJosmDataSource).subscribe({
      next: () => {
        this.notificationService.addInfo(this.translationService.instant('project-settings.successfully-updated'));
      },
      error: e => {
        console.error(e);
        this.notificationService.addError(this.translationService.instant('project-settings.could-not-update-project'));
      }
    });
  }

  onExportButtonClicked(): void {
    this.projectService.getProjectExport(this.projectId).subscribe({
      next: projectExport => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(projectExport)));
        element.setAttribute('download', 'stm-project-export.json');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      },
      error: e => {
        console.error(e);
        this.notificationService.addError(this.translationService.instant('project-settings.could-not-export-project'));
      }
    });
  }
}
