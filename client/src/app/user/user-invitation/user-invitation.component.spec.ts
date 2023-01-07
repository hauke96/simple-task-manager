import { UserInvitationComponent } from './user-invitation.component';
import { NotificationService } from '../../common/services/notification.service';
import { of, throwError } from 'rxjs';
import { UserService } from '../user.service';
import { User } from '../user.material';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { TranslateService } from '@ngx-translate/core';

describe(UserInvitationComponent.name, () => {
  let component: UserInvitationComponent;
  let fixture: MockedComponentFixture<UserInvitationComponent>;
  let notificationService: NotificationService;
  let userService: UserService;
  let translationService: TranslateService;

  beforeEach(() => {
    notificationService = {} as NotificationService;
    userService = {} as UserService;
    translationService = {} as TranslateService;

    return MockBuilder(UserInvitationComponent, AppModule)
      .provide({provide: UserService, useFactory: () => userService})
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: TranslateService, useFactory: () => translationService});
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
    translationService.instant = jest.fn().mockReturnValue('foo');

    component.enteredUserName = 'test-user';

    // Act
    component.onInvitationButtonClicked();

    // Assert
    expect(inviteUserSpy).not.toHaveBeenCalled();
    expect(translationService.instant).toHaveBeenCalledWith('user.unable-load-user', {user: component.enteredUserName});
    expect(notificationService.addError).toHaveBeenCalledWith('foo');
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
    translationService.instant = jest.fn().mockReturnValue('foo');

    component.enteredUserName = 'test-user';

    // Act
    component.onInvitationButtonClicked();
    component.onInvitationButtonClicked();

    // Assert
    expect(inviteUserSpy).toHaveBeenCalledTimes(1);
    expect(userService.getUserByName).toHaveBeenCalledTimes(1);
    expect(translationService.instant).toHaveBeenCalledWith('user.already-member', {user: component.enteredUserName});
    expect(notificationService.addWarning).toHaveBeenCalledTimes(1);
    expect(notificationService.addWarning).toHaveBeenCalledWith('foo');
  });
});
