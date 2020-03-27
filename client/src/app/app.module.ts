import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ManagerComponent } from './manager/manager.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { OauthLandingComponent } from './auth/oauth-landing.component';
import { ProjectListComponent } from './project/project-list.component';
import { ProjectComponent } from './project/project.component';
import { TaskListComponent } from './task/task-list.component';
import { TaskDetailsComponent } from './task/task-details.component';
import { TaskMapComponent } from './task/task-map.component';

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
    TaskMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
