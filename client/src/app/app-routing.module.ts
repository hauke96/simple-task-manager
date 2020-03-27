import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { OauthLandingComponent } from './auth/oauth-landing.component';
import { ManagerComponent } from './manager/manager.component';

const routes: Routes = [
    { path: '', component: AuthComponent },
    { path: 'manager', component: ManagerComponent, canActivate: [ AuthGuard ] },
    { path: 'oauth-landing', component: OauthLandingComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
