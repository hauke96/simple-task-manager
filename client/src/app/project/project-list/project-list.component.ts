import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../user/current-user.service';
import { Project, ProjectExport } from '../project.material';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { NotificationService } from '../../common/services/notification.service';
import { ProjectImportService } from '../../project-creation/project-import.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    standalone: false
})
export class ProjectListComponent extends Unsubscriber implements OnInit {
  public projects: Project[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private currentUserService: CurrentUserService,
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private translationService: TranslateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.projects = this.route.snapshot.data.projects;

    this.unsubscribeLater(
      this.projectService.projectAdded.subscribe((p: Project) => {
        this.projects.push(p);
      }),
      this.projectService.projectChanged.subscribe((p: Project) => {
        let index = -1;

        for (let i = 0; i < this.projects.length; i++) {
          if (this.projects[i].id === p.id) {
            index = i;
            break;
          }
        }

        if (index !== -1) {
          this.projects[index] = p;
        } else {
          this.projects.push(p);
        }
      }),
      this.projectService.projectDeleted.subscribe((removedProjectId: string) => {
        const project = this.projects.find(p => p.id === removedProjectId);
        if (!project) {
          return;
        }

        const message = this.translationService.instant('project-has-been-removed', {projectName: project.name});
        this.notificationService.addInfo(message);

        this.projects = this.projects.filter(p => p.id !== removedProjectId);
      }),
      this.projectService.projectUserRemoved.subscribe((projectId: string) => {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
          return;
        }

        const message = this.translationService.instant('you-have-been-removed', {projectName: project.name});
        this.notificationService.addInfo(message);

        this.projects = this.projects.filter(p => p.id !== projectId);
      }),
    );
  }

  public get currentUserId(): string | undefined {
    return this.currentUserService.getUserId();
  }

  public onProjectListItemClicked(id: string): void {
    this.router.navigate(['/project', id]);
  }
}
