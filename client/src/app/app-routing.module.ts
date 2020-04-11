import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import { OauthLandingComponent } from './auth/oauth-landing.component';
import { ManagerComponent } from './manager/manager.component';
import { ProjectComponent } from './project/project.component';
import { ProjectCreationComponent } from './project/project-creation.component';
import { AllProjectsResolver } from './project/all-projects.resolver';

const routes: Routes = [
    { path: '', component: AuthComponent },
    { path: 'manager', component: ManagerComponent, canActivate: [ AuthGuard ], resolve: { projects: AllProjectsResolver } },
    { path: 'project/:id', component: ProjectComponent, canActivate: [ AuthGuard ] },
    { path: 'new-project', component: ProjectCreationComponent, canActivate: [ AuthGuard ] },
    { path: 'oauth-landing', component: OauthLandingComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
