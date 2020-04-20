import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInvitationComponent } from './user-invitation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project/project.service';
import { ErrorService } from '../common/error.service';
import { throwError } from 'rxjs';

describe('UserInvitationComponent', () => {
  let component: UserInvitationComponent;
  let fixture: ComponentFixture<UserInvitationComponent>;
  let projectService: ProjectService;
  let errorService: ErrorService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserInvitationComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ]
    })
      .compileComponents();

    projectService = TestBed.inject(ProjectService);
    errorService = TestBed.inject(ErrorService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call project service correctly', () => {
    const inviteUserSpy = spyOn(projectService, 'inviteUser').and.callThrough();

    component.userName = 'test-user';
    component.projectId = '1';

    component.onInvitationButtonClicked();

    expect(component).toBeTruthy();
    expect(inviteUserSpy).toHaveBeenCalledWith('test-user', '1');
  });

  it('should show error on error', () => {
    const inviteUserSpy = spyOn(projectService, 'inviteUser').and.returnValue(throwError('test error'));
    const errorServiceSpy = spyOn(errorService, 'addError').and.callThrough();

    component.userName = 'test-user';
    component.projectId = '1';

    component.onInvitationButtonClicked();

    expect(component).toBeTruthy();
    expect(inviteUserSpy).toHaveBeenCalledWith('test-user', '1');
    expect(errorServiceSpy).toHaveBeenCalled();
  });
});
