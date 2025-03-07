import { Component, Input } from '@angular/core';
import { Project } from '../../project/project.material';
import { ProjectService } from '../../project/project.service';
import { NotificationService } from '../../common/services/notification.service';
import { ProjectImportService } from '../project-import.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-copy-project',
    templateUrl: './copy-project.component.html',
    styleUrls: ['./copy-project.component.scss'],
    standalone: false
})
export class CopyProjectComponent {
  @Input() projects: Project[];
  @Input() loading: boolean;

  public selectedProject: Project | undefined;

  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private projectImportService: ProjectImportService,
    private translateService: TranslateService
  ) {
  }

  onProjectClicked(project: Project): void {
    this.selectedProject = project !== this.selectedProject ? project : undefined;
  }

  onImportClicked(): void {
    if (!this.selectedProject) {
      return;
    }

    this.projectService
      .getProjectExport(this.selectedProject.id)
      .subscribe({
        next: projectExport => {
          this.projectImportService.importProjectAsNewProject(projectExport);
          this.selectedProject = undefined;
        },
        error: e => {
          console.error(e);
          const translationParams = {projectName: this.selectedProject?.name};
          const message = this.translateService.instant('project-creation.could-not-import-project', translationParams);
          this.notificationService.addError(message);
          this.selectedProject = undefined;
        }
      });
  }
}
