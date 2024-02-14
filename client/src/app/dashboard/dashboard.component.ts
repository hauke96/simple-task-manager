import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../user/current-user.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { ProjectExport } from '../project/project.material';
import { ProjectImportService } from '../project-creation/project-import.service';
import { NotificationService } from '../common/services/notification.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private currentUserService: CurrentUserService,
    private projectImportService: ProjectImportService,
    private notificationService: NotificationService,
    private translationService: TranslateService
  ) {
  }

  public get userName(): string | undefined {
    return this.currentUserService.getUserName();
  }

  public onLogoutClicked(): void {
    this.authService.logout();
  }

  onImportProjectClicked(event: Event): void {
    this.uploadFile(event, (e) => this.addProjectExport(e));
  }

  private addProjectExport(evt: Event): void {
    // @ts-ignore
    const project = JSON.parse(evt.target?.result) as ProjectExport;
    this.projectImportService.importProject(project);
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

  public onUploadClicked(): void {
    document.getElementById('projectInput')?.click();
  }
}
