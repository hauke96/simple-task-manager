import { Component, OnInit, Input } from '@angular/core';
import { ProjectService } from './project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {
  @Input() projectId: string;

  // TODO only enable delete button when user is owner of project
  constructor(
    private projectService: ProjectService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  public onDeleteButtonClicked() {
    // TODO show a yes/no confirmation dialog or something
    this.projectService.deleteProject(this.projectId)
      .subscribe(() => {}, err => console.error(err));
    this.router.navigate(['/manager']);
  }
}
