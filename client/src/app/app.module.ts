import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ManagerComponent } from './manager/manager.component';
import { AuthComponent } from './auth/auth.component';
import { OauthLandingComponent } from './auth/oauth-landing.component';

@NgModule({
  declarations: [
    AppComponent,
    ManagerComponent,
    AuthComponent,
    OauthLandingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
