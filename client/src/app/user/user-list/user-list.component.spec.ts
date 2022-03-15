import { UserListComponent } from './user-list.component';
import { CurrentUserService } from '../current-user.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(UserListComponent.name, () => {
  let component: UserListComponent;
  let fixture: MockedComponentFixture<UserListComponent>;
  let currentUserService: CurrentUserService;

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    currentUserService.getUserId = jest.fn().mockReturnValue('123');

    return MockBuilder(UserListComponent, AppModule)
      .provide({provide: CurrentUserService, useFactory: () => currentUserService});
  });

  beforeEach(() => {
    fixture = MockRender(UserListComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should detect removable users', () => {
    component.ownerUid = '123';
    expect(component).toBeTruthy();

    expect(component.canRemove('123')).toEqual(false);
    expect(component.canRemove('234')).toEqual(true);
    expect(component.canRemove('345')).toEqual(true);
  });

  it('should remove user correctly', () => {
    // Arrange
    const removeUserSpy = jest.fn();
    component.userRemoved.subscribe(removeUserSpy);

    component.ownerUid = '123';
    expect(component).toBeTruthy();

    // Act
    component.onRemoveUserClicked('123');

    // Assert
    expect(removeUserSpy).toHaveBeenCalledWith('123');
  });
});
