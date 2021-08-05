import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { OauthLandingComponent } from './auth/oauth-landing/oauth-landing.component';
import { ManagerComponent } from './manager/manager.component';
import { ProjectComponent } from './project/project/project.component';
import { ProjectCreationComponent } from './project-creation/project-creation/project-creation.component';
import { AllProjectsResolver } from './project/all-projects.resolver';
import { ProjectResolver } from './project/project.resolver';
import { SelectedLanguageGuard } from './common/selected-language.guard';
import { ConfigResolver } from './config/config.resolver';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [AuthGuard, SelectedLanguageGuard],
    resolve: {config: ConfigResolver}
  },
  {
    path: 'manager',
    component: ManagerComponent,
    canActivate: [AuthGuard, SelectedLanguageGuard],
    resolve: {projects: AllProjectsResolver, config: ConfigResolver}
  },
  {
    path: 'project/:id',
    component: ProjectComponent,
    canActivate: [AuthGuard, SelectedLanguageGuard],
    resolve: {
      project: ProjectResolver
    }
  },
  {
    path: 'new-project',
    component: ProjectCreationComponent,
    canActivate: [AuthGuard, SelectedLanguageGuard],
    resolve: {config: ConfigResolver}
  },
  {path: 'oauth-landing', component: OauthLandingComponent},
  {path: '**', redirectTo: ''},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
