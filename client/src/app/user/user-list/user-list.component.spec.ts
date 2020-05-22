import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListComponent } from './user-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../project/project.service';
import { CurrentUserService } from '../current-user.service';
import { Project } from '../../project/project.material';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ErrorService } from '../../common/error.service';
import { MockRouter } from '../../common/mock-router';
import { Task, TestTaskGeometry } from '../../task/task.material';
import { User } from '../user.material';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let projectService: ProjectService;
  let currentUserService: CurrentUserService;
  let errorService: ErrorService;
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

    projectService = TestBed.inject(ProjectService);
    currentUserService = TestBed.inject(CurrentUserService);
    errorService = TestBed.inject(ErrorService);
    routerMock = TestBed.inject(Router);

    spyOn(currentUserService, 'getUserId').and.returnValue('123');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should detect removable users', () => {
    component.project = createProject();
    expect(component).toBeTruthy();

    expect(component.canRemove('123')).toBeFalse();
    expect(component.canRemove('234')).toBeTrue();
    expect(component.canRemove('345')).toBeTrue();
  });

  it('should remove user correctly', () => {
    const removeUserSpy = spyOn(projectService, 'removeUser').and.callThrough();

    component.project = createProject();
    expect(component).toBeTruthy();

    component.onRemoveUserClicked('123');

    expect(removeUserSpy).toHaveBeenCalledWith('1', '123');
  });

  it('should show error on error', () => {
    spyOn(routerMock, 'navigate').and.callThrough();
    const removeUserSpy = spyOn(projectService, 'removeUser').and.returnValue(throwError('test error'));
    const errorServiceSpy = spyOn(errorService, 'addError').and.callThrough();

    component.project = createProject();
    expect(component).toBeTruthy();

    component.onRemoveUserClicked('123');

    expect(removeUserSpy).toHaveBeenCalledWith('1', '123');
    expect(errorServiceSpy).toHaveBeenCalled();
  });

  function createProject() {
    const t = new Task('567', 10, 100, TestTaskGeometry);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }
});
