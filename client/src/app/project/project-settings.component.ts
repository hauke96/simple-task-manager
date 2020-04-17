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

  public requestDeleteConfirmation: boolean;
  public isOwner: boolean;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
  }

  public get canDelete(): boolean {
    return this.userService.getUser() === this.projectOwner;
  }

  public onDeleteButtonClicked() {
    this.requestDeleteConfirmation = true;
  }

  public onNoButtonClicked() {
    this.requestDeleteConfirmation = false;
  }

  public onYesButtonClicked(){
    this.projectService.deleteProject(this.projectId)
      .subscribe(() => {
        this.requestDeleteConfirmation = false;
        this.router.navigate(['/manager']);
      }, err => {
        console.error(err);
        this.requestDeleteConfirmation = false;
      });
  }

  onLeaveProjectClicked() {
    this.projectService.leaveProject(this.projectId)
      .subscribe(() => {
        this.router.navigate(['/manager']);
      });
  }
}
