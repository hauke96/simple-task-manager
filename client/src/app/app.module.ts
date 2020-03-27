import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ManagerComponent } from './manager/manager.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { OauthLandingComponent } from './auth/oauth-landing.component';
import { ProjectListComponent } from './project/project-list.component';

@NgModule({
  declarations: [
    AppComponent,
    ManagerComponent,
    AuthComponent,
    OauthLandingComponent,
    ProjectListComponent
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
