import { Component, OnInit } from '@angular/core';
import { UserService } from '../../user/user.service';
import { Project } from '../project.material';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessPointColorService } from '../../common/process-point-color.service';

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
    private userService: UserService,
    private processPointColorService: ProcessPointColorService
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

  getProcessPointColor(project: Project) {
    return this.processPointColorService.getProcessPointsColor(project.doneProcessPoints, project.totalProcessPoints);
  }

  getProcessPointWidth(project: Project): string {
    return Math.floor(project.doneProcessPoints / project.totalProcessPoints * 100) + 'px';
  }
}
