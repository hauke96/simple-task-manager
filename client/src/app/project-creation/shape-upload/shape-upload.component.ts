import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../common/notification.service';
import { GeometryService } from '../../common/geometry.service';
import { TaskDraftService } from '../task-draft.service';
import { ProjectExport } from '../../project/project.material';
import { ProjectImportService } from '../project-import.service';

@Component({
  selector: 'app-shape-upload',
  templateUrl: './shape-upload.component.html',
  styleUrls: ['./shape-upload.component.scss']
})
export class ShapeUploadComponent implements OnInit {
  constructor(
    private notificationService: NotificationService,
    private geometryService: GeometryService,
    private taskDraftService: TaskDraftService,
    private projectImportService: ProjectImportService
  ) {
  }

  ngOnInit(): void {
  }

  public onFileSelected(event: any) {
    this.uploadFile(event, (e) => this.addTasks(e));
  }

  public addTasks(evt) {
    try {
      const features = this.geometryService.parseData(evt.target.result);

      if (!!features && features.length !== 0) {
        this.taskDraftService.addTasks(features.map(f => this.taskDraftService.toTaskDraft(f)));
      } else {
        this.notificationService.addError($localize`:@@ERROR_OVERPASS_NO_POLYGONS:No polygons exist or data has unknown format. Supported formats are: GeoJson, OSM-XML, GPX, KML, EsriJson and WKT.`);
      }
    } catch (e) {
      this.notificationService.addError(e);
    }
  }

  public onProjectSelected(event: any) {
    this.uploadFile(event, (e) => this.addProjectExport(e));
  }

  public addProjectExport(evt) {
    const project = JSON.parse(evt.target.result) as ProjectExport;
    this.projectImportService.importProject(project);
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
