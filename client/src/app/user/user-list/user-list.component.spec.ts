import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListComponent } from './user-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../project/project.service';
import { CurrentUserService } from '../current-user.service';
import { Router } from '@angular/router';
import { MockRouter } from '../../common/mock-router';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let currentUserService: CurrentUserService;
  let routerMock: MockRouter;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserListComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
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

    currentUserService = TestBed.inject(CurrentUserService);
    routerMock = TestBed.inject(Router);

    spyOn(currentUserService, 'getUserId').and.returnValue('123');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should detect removable users', () => {
    component.ownerUid = '123';
    expect(component).toBeTruthy();

    expect(component.canRemove('123')).toBeFalse();
    expect(component.canRemove('234')).toBeTrue();
    expect(component.canRemove('345')).toBeTrue();
  });

  it('should remove user correctly', () => {
    const removeUserSpy = spyOn(component.onUserRemove, 'emit').and.callThrough();

    component.ownerUid = '123';
    expect(component).toBeTruthy();

    component.onRemoveUserClicked('123');

    expect(removeUserSpy).toHaveBeenCalledWith('123');
  });
});
