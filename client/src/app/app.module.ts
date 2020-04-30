import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ManagerComponent } from './manager/manager.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { LoggedInInterceptor } from './auth/logged-in.interceptor';
import { OauthLandingComponent } from './auth/oauth-landing.component';
import { ProjectListComponent } from './project/project-list.component';
import { ProjectComponent } from './project/project.component';
import { TaskListComponent } from './task/task-list.component';
import { TaskDetailsComponent } from './task/task-details.component';
import { TaskMapComponent } from './task/task-map.component';
import { FooterComponent } from './ui/footer.component';
import { ProjectCreationComponent } from './project/project-creation.component';
import { TabsComponent } from './ui/tabs.component';
import { UserListComponent } from './user/user-list.component';
import { UserInvitationComponent } from './user/user-invitation.component';
import { ProjectSettingsComponent } from './project/project-settings.component';
import { NotificationComponent } from './ui/notification.component';
import { ToolbarComponent } from './ui/toolbar.component';
import { ShapeDivideComponent } from './project/shape-divide/shape-divide.component';
import { ShapeUploadComponent } from './project/shape-upload/shape-upload.component';
import { MaxValidatorDirective } from './ui/max-validator.directive';
import { MinValidatorDirective } from './ui/min-validator.directive';

@NgModule({
  declarations: [
    AppComponent,
    ManagerComponent,
    AuthComponent,
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
    MinValidatorDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggedInInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
