import { Component, OnInit } from '@angular/core';
import { ProjectService } from './project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  constructor(private projectService: ProjectService, private router: Router) { }

  public get projects() {
    return this.projectService.getProjects();
  }

  ngOnInit(): void {
  }

  public onProjectListItemClicked(id: string) {
    this.router.navigate(['/project', id]);
  }

  public onCreateProjectButtonClicked() {
    
  }
}
