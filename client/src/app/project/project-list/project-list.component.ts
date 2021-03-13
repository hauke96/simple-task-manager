import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../user/current-user.service';
import { Project, ProjectExport } from '../project.material';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { NotificationService } from '../../common/notification.service';
import { ProjectImportService } from '../../project-creation/project-import.service';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent extends Unsubscriber implements OnInit {
  public projects: Project[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private currentUserService: CurrentUserService,
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private projectImportService: ProjectImportService
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
        if (!this.projects.map(p => p.id).includes(removedProjectId)) {
          return;
        }

        const project = this.projects.find(p => p.id === removedProjectId);
        this.notificationService.addInfo($localize`:@@WARN_PROJECT_REMOVED:The project '${project.name}:INTERPOLATION:' has been removed`);

        this.projects = this.projects.filter(p => p.id !== removedProjectId);
      }),
      this.projectService.projectUserRemoved.subscribe((projectId: string) => {
        if (!this.projects.map(p => p.id).includes(projectId)) {
          return;
        }

        const project = this.projects.find(p => p.id === projectId);
        this.notificationService.addInfo($localize`:@@WARN_REMOVED_USER_PROJECT:You have been removed from project '${project.name}:INTERPOLATION:'`);

        this.projects = this.projects.filter(p => p.id !== projectId);
      })
    );
  }

  public get currentUserId(): string {
    return this.currentUserService.getUserId();
  }

  public onProjectListItemClicked(id: string) {
    this.router.navigate(['/project', id]);
  }

  onImportProjectClicked(event: Event) {
    this.uploadFile(event, (e) => this.addProjectExport(e));
  }

  public addProjectExport(evt) {
    const project = JSON.parse(evt.target.result) as ProjectExport;
    this.projectImportService.importProjectAsNewProject(project);
  }

  private uploadFile(event: any, loadHandler: (evt) => void) {
    const reader = new FileReader();
    const file = event.target.files[0];

    reader.readAsText(file, 'UTF-8');

    reader.onload = loadHandler;
    reader.onerror = (evt) => {
      console.error(evt);
      this.notificationService.addError($localize`:@@ERROR_COULD_NOT_UPLOAD:Could not upload file '${(evt.target as any).files[0]}:INTERPOLATION:'`);
    };
  }
}
