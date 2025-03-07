import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../common/services/notification.service';
import { GeometryService } from '../../common/services/geometry.service';
import { LoadingService } from '../../common/services/loading.service';
import { TaskDraftService } from '../task-draft.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-shape-remote',
    templateUrl: './shape-remote.component.html',
    styleUrls: ['./shape-remote.component.scss'],
    standalone: false
})
export class ShapeRemoteComponent {
  public queryUrl: string;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private geometryService: GeometryService,
    private loadingService: LoadingService,
    private taskDraftService: TaskDraftService,
    private translationService: TranslateService
  ) {
  }

  onLoadButtonClicked(): void {
    this.loadingService.start();

    this.http.get(this.queryUrl, {responseType: 'text'}).subscribe(
      data => {
        this.loadingService.end();

        const features = this.geometryService.parseData(data);

        if (!!features && features.length !== 0) {
          this.taskDraftService.addTasks(features.map(f => this.taskDraftService.toTaskDraft(f)));
        } else {
          this.notificationService.addError(this.translationService.instant('feature-upload-error'));
        }
      }, e => {
        this.loadingService.end();
        console.error('Error loading data from remote URL');
        console.error(e);
        this.notificationService.addError(this.translationService.instant('project-creation.remote-url-error'));
      });
  }
}
