import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../project.service';
import { Router } from '@angular/router';
import { CurrentUserService } from '../../user/current-user.service';
import { ErrorService } from '../../common/error.service';
import { User } from '../../user/user.material';

@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {
  @Input() projectId: string;
  @Input() projectOwner: User;
  @Input() projectName: string;
  @Input() projectDescription: string;

  public newProjectName: string;
  public newProjectDescription: string;

  public requestConfirmation: boolean;

  private action = '';

  constructor(
    private projectService: ProjectService,
    private currentUserService: CurrentUserService,
    private errorService: ErrorService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // The owner cannot leave but only delete a project.
    // A normal member cannot delete a project but leave it.
    this.action = this.isOwner ? 'delete' : 'leave';
    this.newProjectName = this.projectName;
    this.newProjectDescription = this.projectDescription;
  }

  public get isOwner(): boolean {
    return this.currentUserService.getUserId() === this.projectOwner.uid;
  }

  public onDeleteButtonClicked() {
    this.requestConfirmation = true;
  }

  public onLeaveProjectClicked() {
    this.requestConfirmation = true;
  }

  public onNoButtonClicked() {
    this.requestConfirmation = false;
  }

  public onYesButtonClicked() {
    if (this.action === 'delete') {
      this.deleteProject();
    } else if (this.action === 'leave') {
      this.leaveProject();
    }
  }

  private deleteProject() {
    this.projectService.deleteProject(this.projectId)
      .subscribe(() => {
        this.requestConfirmation = false;
        this.router.navigate(['/manager']);
      }, err => {
        console.error(err);
        this.errorService.addError('Could not delete project');
        this.requestConfirmation = false;
      });
  }

  private leaveProject() {
    this.projectService.leaveProject(this.projectId)
      .subscribe(() => {
        this.requestConfirmation = false;
        this.router.navigate(['/manager']);
      }, err => {
        console.error(err);
        this.errorService.addError('Could not leave project');
        this.requestConfirmation = false;
      });
  }

  onSaveButtonClicked() {
    if (this.projectName !== this.newProjectName) {
      this.projectService.updateName(this.projectId, this.newProjectName).subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.errorService.addError('Unable to update name');
        }
      );
    }
    if (this.projectDescription !== this.projectDescription) {
      this.projectService.updateDescription(this.projectId, this.newProjectDescription).subscribe(
        () => {
        },
        e => {
          console.error(e);
          this.errorService.addError('Unable to update description');
        }
      );
    }
  }
}
