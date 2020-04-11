import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from './project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {
  @Input() projectId: string;

  public requestDeleteConfirmation: boolean;

  // TODO only enable delete button when user is owner of project
  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
  }

  public onDeleteButtonClicked() {
    this.requestDeleteConfirmation = true;
  }

  public onDeleteCancelButtonClicked() {
    this.requestDeleteConfirmation = false;
  }

  public onDeleteConfirmButtonClicked(){
    // TODO show a yes/no confirmation dialog or something
    this.projectService.deleteProject(this.projectId)
      .subscribe(() => {
        this.requestDeleteConfirmation = false;
        this.router.navigate(['/manager']);
      }, err => {
        console.error(err);
        this.requestDeleteConfirmation = false;
      });
  }
}
