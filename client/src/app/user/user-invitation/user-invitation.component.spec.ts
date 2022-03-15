import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserInvitationComponent } from './user-invitation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../common/services/notification.service';
import { of, throwError } from 'rxjs';
import { UserService } from '../user.service';
import { User } from '../user.material';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(UserInvitationComponent.name, () => {
  let component: UserInvitationComponent;
  let fixture: MockedComponentFixture<UserInvitationComponent>;
  let notificationService: NotificationService;
  let userService: UserService;

  beforeEach(() => {
    notificationService = {} as NotificationService;
    userService = {} as UserService;

    return MockBuilder(UserInvitationComponent, AppModule)
      .provide({provide: UserService, useFactory: () => userService})
      .provide({provide: NotificationService, useFactory: () => notificationService});
  });

  beforeEach(() => {
    fixture = MockRender(UserInvitationComponent);
    component = fixture.point.componentInstance;
    component.users = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fire event correctly', () => {
    // Arrange
    const user = new User('test-user', '123');

    const inviteUserSpy = jest.fn();
    component.userInvited.subscribe(inviteUserSpy);
    userService.getUserByName = jest.fn().mockReturnValue(of(user));

    component.enteredUserName = 'test-user';

    // Act
    component.onInvitationButtonClicked();

    // Assert
    expect(inviteUserSpy).toHaveBeenCalledWith(user);
  });

  it('should show error message on user service error', () => {
    // Arrange
    const inviteUserSpy = jest.fn();
    component.userInvited.subscribe(inviteUserSpy);
    notificationService.addError = jest.fn();
    userService.getUserByName = jest.fn().mockReturnValue(throwError(() => new Error('BOOM!')));

    component.enteredUserName = 'test-user';

    // Act
    component.onInvitationButtonClicked();

    // Assert
    expect(inviteUserSpy).not.toHaveBeenCalled();
    expect(notificationService.addError).toHaveBeenCalled();
  });

  it('should so nothing when adding user twice', () => {
    // Arrange
    const inviteUserSpy = jest.fn();
    component.userInvited.subscribe(inviteUserSpy);
    userService.getUserByName = jest.fn().mockImplementation((userName: string) => {
      const user = new User(userName, userName);
      component.users.push(user);
      return of(user);
    });
    notificationService.addWarning = jest.fn();

    component.enteredUserName = 'test-user';

    // Act
    component.onInvitationButtonClicked();
    component.onInvitationButtonClicked();

    // Assert
    expect(inviteUserSpy).toHaveBeenCalledTimes(1);
    expect(userService.getUserByName).toHaveBeenCalledTimes(1);
    expect(notificationService.addWarning).toHaveBeenCalledTimes(1);
  });
});
