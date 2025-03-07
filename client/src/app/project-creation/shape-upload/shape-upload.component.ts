import { Component } from '@angular/core';
import { NotificationService } from '../../common/services/notification.service';
import { GeometryService } from '../../common/services/geometry.service';
import { TaskDraftService } from '../task-draft.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-shape-upload',
    templateUrl: './shape-upload.component.html',
    styleUrls: ['./shape-upload.component.scss'],
    standalone: false
})
export class ShapeUploadComponent {
  constructor(
    private notificationService: NotificationService,
    private geometryService: GeometryService,
    private taskDraftService: TaskDraftService,
    private translationService: TranslateService
  ) {
  }

  public onFileSelected(event: any): void {
    this.uploadFile(event, (e) => this.addTasks(e));
  }

  public addTasks(evt: Event): void {
    if (!evt || !evt.target) {
      return;
    }

    try {
      // @ts-ignore
      const features = this.geometryService.parseData(evt.target.result);

      if (!!features && features.length !== 0) {
        this.taskDraftService.addTasks(features.map(f => this.taskDraftService.toTaskDraft(f)));
      } else {
        this.notificationService.addError(this.translationService.instant('feature-upload-error'));
      }
    } catch (e) {
      this.notificationService.addError('Error: ' + e);
    }
  }

  private uploadFile(event: any, loadHandler: (evt: Event) => void): void {
    const reader = new FileReader();
    const file = event.target.files[0];

    reader.readAsText(file, 'UTF-8');

    reader.onload = loadHandler;
    reader.onerror = (evt) => {
      console.error(evt);
      const message = this.translationService.instant('file-upload-error', {fileName: (evt.target as any).files[0]});
      this.notificationService.addError(message);
    };
  }
}
