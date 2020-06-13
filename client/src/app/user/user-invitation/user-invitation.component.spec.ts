import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInvitationComponent } from './user-invitation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ErrorService } from '../../common/error.service';
import { of, throwError } from 'rxjs';
import { UserService } from '../user.service';
import { User } from '../user.material';

describe('UserInvitationComponent', () => {
  let component: UserInvitationComponent;
  let fixture: ComponentFixture<UserInvitationComponent>;
  let errorService: ErrorService;
  let userService: UserService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserInvitationComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ]
    })
      .compileComponents();

    errorService = TestBed.inject(ErrorService);
    userService = TestBed.inject(UserService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fire event correctly', () => {
    const user = new User('test-user', '123');

    const inviteUserSpy = spyOn(component.userInvited, 'emit').and.callThrough();
    spyOn(userService, 'getUserByName').and.returnValue(of(user));

    component.userName = 'test-user';

    component.onInvitationButtonClicked();

    expect(inviteUserSpy).toHaveBeenCalledWith(user);
  });

  it('should show error message on user service error', () => {
    const inviteUserSpy = spyOn(component.userInvited, 'emit').and.callThrough();
    const errorSpy = spyOn(errorService, 'addError').and.callThrough();
    spyOn(userService, 'getUserByName').and.returnValue(throwError('BOOM!'));

    component.userName = 'test-user';

    component.onInvitationButtonClicked();

    expect(inviteUserSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
