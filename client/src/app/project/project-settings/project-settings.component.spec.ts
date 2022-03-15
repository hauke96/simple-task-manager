import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectSettingsComponent } from './project-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProjectService } from '../project.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MockRouter } from '../../common/mock-router';
import { CurrentUserService } from '../../user/current-user.service';
import { User } from '../../user/user.material';
import { FormsModule } from '@angular/forms';
import { EventEmitter } from '@angular/core';
import { Project } from '../project.material';
import { MockBuilder } from 'ng-mocks';
import { ProjectListComponent } from '../project-list/project-list.component';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../common/services/notification.service';

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let projectService: ProjectService;
  let router: Router;
  let currentUserService: CurrentUserService;

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    projectService = {
      projectAdded: new EventEmitter<Project>(),
      projectChanged: new EventEmitter<Project>(),
      projectDeleted: new EventEmitter<string>(),
      projectUserRemoved: new EventEmitter<string>(),
    } as ProjectService;
    router = {} as Router;

    return MockBuilder(ProjectListComponent, AppModule)
      .provide({provide: ProjectService, useFactory: () => projectService})
      .provide({provide: Router, useFactory: () => router})
      .provide({provide: CurrentUserService, useFactory: () => currentUserService});
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsComponent);
    component = fixture.componentInstance;
    component.projectOwner = new User('test user', '123');
    currentUserService.getUserId = jest.fn().mockReturnValue('123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set action for owner correctly', () => {
    component.ngOnInit();
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
    projectService.updateName = jest.fn().mockReturnValue(of());
    projectService.updateDescription = jest.fn().mockReturnValue(of());

    component.projectId = '1';
    component.projectName = 'old name';
    component.newProjectName = 'foo';
    component.projectDescription = 'old description';
    component.newProjectDescription = 'bar';

    component.onSaveButtonClicked();

    expect(projectService.updateName).toHaveBeenCalledWith('1', 'foo');
    expect(projectService.updateDescription).toHaveBeenCalledWith('1', 'bar');
  });
});
