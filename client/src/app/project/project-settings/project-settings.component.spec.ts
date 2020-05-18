import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsComponent } from './project-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProjectService } from '../project.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MockRouter } from '../../common/mock-router';
import { UserService } from '../../user/user.service';

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let projectService: ProjectService;
  let routerMock: MockRouter;
  let userService: UserService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectSettingsComponent],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ProjectService,
        {
          provide: Router,
          useClass: MockRouter
        }
      ]
    })
      .compileComponents();

    projectService = TestBed.inject(ProjectService);
    routerMock = TestBed.inject(Router);
    userService = TestBed.inject(UserService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set action for owner correctly', () => {
    component.projectOwner = 'test-user';
    spyOn(userService, 'getUserName').and.returnValue('test-user');
    component.ngOnInit();
    // @ts-ignore
    expect(component.action).toEqual('delete');
  });

  it('should set action for non-owner correctly', () => {
    component.projectOwner = 'test-user';
    spyOn(userService, 'getUserName').and.returnValue('some other user');
    component.ngOnInit();
    // @ts-ignore
    expect(component.action).toEqual('leave');
  });

  //
  // Confirmation checks
  //

  it('should request confirmation on delete', () => {
    const spy = spyOn(routerMock, 'navigate');
    component.onDeleteButtonClicked();

    expect(spy).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(true);
  });

  it('should request confirmation on leave', () => {
    const spy = spyOn(routerMock, 'navigate');
    component.onLeaveProjectClicked();

    expect(spy).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(true);
  });

  it('should reset request confirmation on no button', () => {
    const spy = spyOn(routerMock, 'navigate');
    component.requestConfirmation = true;

    component.onNoButtonClicked();

    expect(spy).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(false);
  });

  //
  // Remove project
  //

  it('should remove project on yes button', () => {
    spyOn(projectService, 'deleteProject').and.callFake((id: string) => {
      expect(id).toEqual('1');
      return of({});
    });
    spyOn(routerMock, 'navigate').and.callThrough();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'delete';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/manager']);
    expect(component.requestConfirmation).toEqual(false);
  });

  it('should not navigate on error when removing project', () => {
    spyOn(projectService, 'deleteProject').and.callFake((id: string) => {
      expect(id).toEqual('1');
      return throwError('Test-error');
    });
    spyOn(routerMock, 'navigate').and.callThrough();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'delete';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(false);
  });

  //
  // Leave project
  //

  it('should leave project on yes button', () => {
    spyOn(userService, 'getUserName').and.returnValue('test-user');
    spyOn(projectService, 'removeUser').and.callFake((id: string, user: string) => {
      expect(id).toEqual('1');
      expect(user).toEqual('test-user');
      return of({});
    });
    spyOn(routerMock, 'navigate').and.callThrough();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'leave';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/manager']);
    expect(component.requestConfirmation).toEqual(false);
  });

  it('should not navigate on error when leaving project', () => {
    spyOn(userService, 'getUserName').and.returnValue('test-user');
    spyOn(projectService, 'removeUser').and.callFake((id: string, user: string) => {
      expect(id).toEqual('1');
      expect(user).toEqual('test-user');
      return throwError('Test-error');
    });
    spyOn(routerMock, 'navigate').and.callThrough();
    component.projectId = '1';
    // @ts-ignore
    component.action = 'leave';
    component.requestConfirmation = true;

    component.onYesButtonClicked();

    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(component.requestConfirmation).toEqual(false);
  });
});
