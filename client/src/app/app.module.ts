import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ManagerComponent } from './manager/manager.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { LoggedInInterceptor } from './auth/logged-in.interceptor';
import { OauthLandingComponent } from './auth/oauth-landing/oauth-landing.component';
import { ProjectListComponent } from './project/project-list/project-list.component';
import { ProjectComponent } from './project/project/project.component';
import { TaskListComponent } from './task/task-list/task-list.component';
import { TaskDetailsComponent } from './task/task-details/task-details.component';
import { TaskMapComponent } from './task/task-map/task-map.component';
import { FooterComponent } from './ui/footer/footer.component';
import { ProjectCreationComponent } from './project-creation/project-creation/project-creation.component';
import { TabsComponent } from './ui/tabs/tabs.component';
import { UserListComponent } from './user/user-list/user-list.component';
import { UserInvitationComponent } from './user/user-invitation/user-invitation.component';
import { ProjectSettingsComponent } from './project/project-settings/project-settings.component';
import { NotificationComponent } from './ui/notification/notification.component';
import { ToolbarComponent } from './ui/toolbar/toolbar.component';
import { ShapeDivideComponent } from './project-creation/shape-divide/shape-divide.component';
import { ShapeUploadComponent } from './project-creation/shape-upload/shape-upload.component';
import { MaxValidatorDirective } from './ui/max-validator.directive';
import { MinValidatorDirective } from './ui/min-validator.directive';
import { ShapeRemoteComponent } from './project-creation/shape-remote/shape-remote.component';

import { TranslationExtractionComponent } from './translation-extraction.component';
import { LanguageSelectionComponent } from './ui/language-selection/language-selection.component';
import { SelectedLanguageGuard } from './common/selected-language.guard';
import { DrawingToolbarComponent } from './project-creation/drawing-toolbar/drawing-toolbar.component';
import { TaskDraftListComponent } from './project-creation/task-draft-list/task-draft-list.component';
import { ProjectPropertiesComponent } from './project-creation/project-properties/project-properties.component';
import { TaskEditComponent } from './project-creation/task-edit/task-edit.component';
import { ZoomControlComponent } from './ui/zoom-control/zoom-control.component';
import { ProgressBarComponent } from './ui/progress-bar/progress-bar.component';
import { TaskTitlePipe } from './task/task-title.pipe';
import { GlobalErrorHandler } from './error-handler';
import { ProjectImportComponent } from './project-creation/project-import/project-import.component';
import { CopyProjectComponent } from './project-creation/copy-project/copy-project.component';

@NgModule({
  declarations: [
    AppComponent,
    ManagerComponent,
    LoginComponent,
    OauthLandingComponent,
    ProjectListComponent,
    ProjectComponent,
    TaskListComponent,
    TaskDetailsComponent,
    TaskMapComponent,
    FooterComponent,
    ProjectCreationComponent,
    TabsComponent,
    UserListComponent,
    UserInvitationComponent,
    ProjectSettingsComponent,
    NotificationComponent,
    ToolbarComponent,
    ShapeDivideComponent,
    ShapeUploadComponent,
    MaxValidatorDirective,
    MinValidatorDirective,
    ShapeRemoteComponent,
    TranslationExtractionComponent,
    LanguageSelectionComponent,
    DrawingToolbarComponent,
    TaskDraftListComponent,
    ProjectPropertiesComponent,
    TaskEditComponent,
    ZoomControlComponent,
    ProgressBarComponent,
    TaskTitlePipe,
    ProjectImportComponent,
    CopyProjectComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    SelectedLanguageGuard,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggedInInterceptor,
      multi: true
    },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
