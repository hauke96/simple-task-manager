import { Component, OnInit } from '@angular/core';
import { ProjectService } from './project.service';
import { UserService } from './../auth/user.service';
import { Project } from './project.material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  public projects: Project[];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.projectService.getProjects().subscribe(p => this.projects = p);
  }

  public get currentUser(): string {
    return this.userService.getUser();
  }

  public onProjectListItemClicked(id: string) {
    this.router.navigate(['/project', id]);
  }
}
