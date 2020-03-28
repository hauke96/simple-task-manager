import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from './project.service';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss']
})
export class ProjectCreationComponent implements OnInit {
  public newProjectName: string;

  constructor(private projectService: ProjectService, private router: Router) { }

  ngOnInit(): void {
  }

  public onSaveButtonClicked() {
    this.projectService.createNewProject(this.newProjectName);
    this.router.navigate(['/manager']);
  }
}
