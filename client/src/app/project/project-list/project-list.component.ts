import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../user/current-user.service';
import { Project } from '../project.material';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcessPointColorService } from '../../common/process-point-color.service';
import { ProjectService } from '../project.service';

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
    private currentUserService: CurrentUserService,
    private processPointColorService: ProcessPointColorService,
    private projectService: ProjectService
  ) {
  }

  ngOnInit(): void {
    this.projects = this.route.snapshot.data.projects;

    this.projectService.projectAdded.subscribe((p: Project) => {
      this.projects.push(p);
    });
    this.projectService.projectChanged.subscribe((p: Project) => {
      for (let i = 0; i < this.projects.length; i++) {
        if (this.projects[i].id === p.id) {
          this.projects[i] = p;
        }
      }
    });
    this.projectService.projectDeleted.subscribe((removedProjectId: string) => {
      this.projects = this.projects.filter(p => p.id !== removedProjectId);
    });

    // TODO proper unsubscription
  }

  public get currentUserId(): string {
    return this.currentUserService.getUserId();
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
