import { ProjectSettingsComponent } from './project-settings.component';
import { ProjectService } from '../project.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrentUserService } from '../../user/current-user.service';
import { User } from '../../user/user.material';
import { EventEmitter } from '@angular/core';
import { Project, ProjectUpdateDto } from '../project.material';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { TranslateService } from '@ngx-translate/core';

describe(ProjectSettingsComponent.name, () => {
  let component: ProjectSettingsComponent;
  let fixture: MockedComponentFixture<ProjectSettingsComponent, any>;
  let projectService: ProjectService;
  let router: Router;
  let currentUserService: CurrentUserService;
  let translationService: TranslateService;

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    currentUserService.getUserId = jest.fn().mockReturnValue('123');
    projectService = {
      projectAdded: new EventEmitter<Project>(),
      projectChanged: new EventEmitter<Project>(),
      projectDeleted: new EventEmitter<string>(),
      projectUserRemoved: new EventEmitter<string>(),
    } as ProjectService;
    router = {} as Router;
    translationService = {} as TranslateService;

    const activeRoute = {
      queryParams: of([{
        auth_token: 'abc123'
      }])
    };

    return MockBuilder(ProjectSettingsComponent, AppModule)
      .provide({provide: Router, useFactory: () => router})
      .provide({provide: ActivatedRoute, useFactory: () => activeRoute})
      .provide({provide: ProjectService, useFactory: () => projectService})
      .provide({provide: CurrentUserService, useFactory: () => currentUserService})
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(ProjectSettingsComponent, {
      projectOwner: new User('test user', '123')
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set action for owner correctly', () => {
    // @ts-ignore
    expect(component.action).toEqual('delete');
  });

  it('should set action for non-owner correctly', () => {
    component.projectOwner = new User('some other test user', '234');
    component.ngOnInit();
    // @ts-ignore
    expect(component.action).toEqual('leave');
  });

  //
  // Confirmation checks
  //

  it('should request confirmation on delete', () => {
    router.navigate = jest.fn();
    component.onDeleteButtonClicked();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(true);
  });

  it('should request confirmation on leave', () => {
    router.navigate = jest.fn();
    component.onLeaveProjectClicked();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(true);
  });

  it('should reset request confirmation on no button', () => {
    router.navigate = jest.fn();
    component.requestConfirmation = true;

    component.onNoButtonClicked();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(false);
  });

  //
  // Remove project
  //

  it('should remove project on yes button', () => {
    projectService.deleteProject = jest.fn().mockImplementation((id: string) => {
      expect(id).toEqual('1');
      return of({});
    });
    component.projectId = '1';
    // @ts-ignore
    component.action = 'delete';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(component.requestConfirmation).toEqual(false);
  });

  it('should not navigate on error when removing project', () => {
    projectService.deleteProject = jest.fn().mockImplementation((id: string) => {
      expect(id).toEqual('1');
      return throwError('Test-error');
    });
    translationService.instant = jest.fn();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'delete';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(component.requestConfirmation).toEqual(false);
  });

  //
  // Leave project
  //

  it('should leave project on yes button', () => {
    projectService.leaveProject = jest.fn().mockImplementation((id: string) => {
      expect(id).toEqual('1');
      return of({});
    });
    router.navigate = jest.fn();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'leave';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.requestConfirmation).toEqual(false);
  });

  it('should not navigate on error when leaving project', () => {
    projectService.leaveProject = jest.fn().mockImplementation((id: string) => {
      expect(id).toEqual('1');
      return throwError('Test-error');
    });
    translationService.instant = jest.fn();
    router.navigate = jest.fn();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'leave';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(false);
  });

  //
  // Update values
  //

  it('should call service on update', () => {
    projectService.update = jest.fn().mockReturnValue(of());

    component.projectId = '1';
    component.projectName = 'old name';
    component.projectDescription = 'old description';
    component.projectJosmDataSource = 'OSM';

    component.newProjectName = 'foo';
    component.newProjectDescription = 'bar';
    component.newJosmDataSource = 'OVERPASS';

    component.onSaveButtonClicked();

    expect(projectService.update)
      .toHaveBeenCalledWith('1', component.newProjectName, component.newProjectDescription, component.newJosmDataSource);
  });
});
