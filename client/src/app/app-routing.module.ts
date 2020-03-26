import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { OauthLandingComponent } from './login/oauth-landing.component';
import { ManagerComponent } from './manager/manager.component';

const routes: Routes = [
	{ path: '', component: LoginComponent },
	{ path: 'manager', component: ManagerComponent },
	{ path: 'oauth-landing', component: OauthLandingComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
