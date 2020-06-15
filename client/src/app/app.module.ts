import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
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
import { ProjectCreationComponent } from './project/project-creation/project-creation.component';
import { TabsComponent } from './ui/tabs/tabs.component';
import { UserListComponent } from './user/user-list/user-list.component';
import { UserInvitationComponent } from './user/user-invitation/user-invitation.component';
import { ProjectSettingsComponent } from './project/project-settings/project-settings.component';
import { NotificationComponent } from './ui/notification/notification.component';
import { ToolbarComponent } from './ui/toolbar/toolbar.component';
import { ShapeDivideComponent } from './project/shape-divide/shape-divide.component';
import { ShapeUploadComponent } from './project/shape-upload/shape-upload.component';
import { MaxValidatorDirective } from './ui/max-validator.directive';
import { MinValidatorDirective } from './ui/min-validator.directive';
import { ShapeRemoteComponent } from './project/shape-remote/shape-remote.component';

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
    ShapeRemoteComponent
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
