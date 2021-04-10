import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../common/notification.service';
import { GeometryService } from '../../common/geometry.service';
import { LoadingService } from '../../common/loading.service';
import { TaskDraftService } from '../task-draft.service';

@Component({
  selector: 'app-shape-remote',
  templateUrl: './shape-remote.component.html',
  styleUrls: ['./shape-remote.component.scss']
})
export class ShapeRemoteComponent implements OnInit {
  public queryUrl: string;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private geometryService: GeometryService,
    private loadingService: LoadingService,
    private taskDraftService: TaskDraftService
  ) {
  }

  ngOnInit(): void {
  }

  onLoadButtonClicked() {
    this.loadingService.start();

    this.http.get(this.queryUrl, {responseType: 'text'}).subscribe(
      data => {
        this.loadingService.end();

        const features = this.geometryService.parseData(data);

        if (!!features && features.length !== 0) {
          this.taskDraftService.addTasks(features.map(f => this.taskDraftService.toTaskDraft(f)));
        } else {
          this.notificationService.addError($localize`:@@ERROR_OVERPASS_NO_POLYGONS:No polygons exist or data has unknown format. Supported formats are: GeoJson, OSM-XML, GPX, KML, EsriJson and WKT.`);
        }
      }, e => {
        this.loadingService.end();
        console.error('Error loading data from remote URL');
        console.error(e);
        this.notificationService.addError($localize`:@@ERROR_UNABLE_LOAD_URL:Unable to load data from remote URL`);
      });
  }
}
