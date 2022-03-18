import { Component, OnInit } from '@angular/core';
import { ProjectExport } from '../../project/project.material';
import { ProjectImportService } from '../project-import.service';
import { NotificationService } from '../../common/services/notification.service';

@Component({
  selector: 'app-project-import',
  templateUrl: './project-import.component.html',
  styleUrls: ['./project-import.component.scss']
})
export class ProjectImportComponent {

  constructor(
    private notificationService: NotificationService,
    private projectImportService: ProjectImportService) {
  }

  public onProjectSelected(event: any): void {
    this.uploadFile(event, (e) => this.addProjectExport(e));
  }

  public addProjectExport(evt: Event): void {
    if (!evt || !evt.target) {
      return;
    }

    // @ts-ignore
    const project = JSON.parse(evt.target.result) as ProjectExport;
    this.projectImportService.importProjectAsNewProject(project);
  }

  private uploadFile(event: any, loadHandler: (evt: Event) => void): void {
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
