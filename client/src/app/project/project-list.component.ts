import { Component, OnInit } from '@angular/core';
import { UserService } from './../user/user.service';
import { Project } from './project.material';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  public projects: Project[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
  }

  ngOnInit(): void {
    this.projects = this.route.snapshot.data.projects;
  }

  public get currentUser(): string {
    return this.userService.getUser();
  }

  public onProjectListItemClicked(id: string) {
    this.router.navigate(['/project', id]);
  }
}
