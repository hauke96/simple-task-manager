import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from './project.service';
import { Router } from '@angular/router';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {
  @Input() projectId: string;
  @Input() projectOwner: string;

  public requestConfirmation: boolean;

  private action = '';

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // The owner cannot leave but only delete a project.
    // A normal member cannot delete a project but leave it.
    this.action = this.isOwner ? 'delete' : 'leave';
  }

  public get isOwner(): boolean {
    return this.userService.getUser() === this.projectOwner;
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
        this.requestConfirmation = false;
      });
  }
}
