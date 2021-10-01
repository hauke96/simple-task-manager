import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../project/project.material';
import { ProjectService } from '../../project/project.service';
import { NotificationService } from '../../common/services/notification.service';
import { ProjectImportService } from '../project-import.service';

@Component({
  selector: 'app-copy-project',
  templateUrl: './copy-project.component.html',
  styleUrls: ['./copy-project.component.scss']
})
export class CopyProjectComponent implements OnInit {
  @Input() projects: Project[];

  public selectedProject: Project | undefined;

  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private projectImportService: ProjectImportService
  ) {
  }

  ngOnInit(): void {
  }

  onProjectClicked(project: Project) {
    this.selectedProject = project !== this.selectedProject ? project : undefined;
  }

  onImportClicked(): void {
    if (!this.selectedProject) {
      return;
    }

    this.projectService
      .getProjectExport(this.selectedProject.id)
      .subscribe(
        projectExport => {
          this.projectImportService.importProjectAsNewProject(projectExport);
          this.selectedProject = undefined;
        },
        e => {
          console.error(e);
          // @ts-ignore See above check
          this.notificationService.addError($localize`:@@ERROR_COULD_NOT_IMPORT:Could not import project '${this.selectedProject.name}:INTERPOLATION:'`);
          this.selectedProject = undefined;
        });
  }
}
