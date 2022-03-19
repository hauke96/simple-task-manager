import { TaskDetailsComponent } from './task-details.component';
import { CurrentUserService } from '../../user/current-user.service';
import { TaskService } from '../task.service';
import { Task, TestTaskFeature } from '../task.material';
import { of, Subject } from 'rxjs';
import { WebsocketClientService } from '../../common/services/websocket-client.service';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.material';
import { ShortcutService } from '../../common/services/shortcut.service';
import { HttpClient } from '@angular/common/http';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../common/services/notification.service';
import { EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

describe(TaskDetailsComponent.name, () => {
  let component: TaskDetailsComponent;
  let fixture: MockedComponentFixture<TaskDetailsComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;
  let websocketService: WebsocketClientService;
  let userService: UserService;
  let shortcutService: ShortcutService;
  let httpClient: HttpClient;
  let notificationService: NotificationService;
  let translationService: TranslateService;

  let shortcutAssignSubject: Subject<void>;
  let shortcutUnassignSubject: Subject<void>;
  let shortcutDoneSubject: Subject<void>;
  let shortcutJosmSubject: Subject<void>;
  let shortcutIdSubject: Subject<void>;

  const testUserId = '123';

  beforeEach(() => {
    currentUserService = {} as CurrentUserService;
    currentUserService.getUserId = jest.fn().mockReturnValue(testUserId);

    userService = {} as UserService;
    userService.getUsersByIds = jest.fn().mockReturnValue(of([new User('Foo', testUserId)]));

    websocketService = {} as WebsocketClientService;
    httpClient = {} as HttpClient;

    taskService = {} as TaskService;
    taskService.getSelectedTask = jest.fn().mockReturnValue(undefined);
    taskService.selectedTaskChanged = new EventEmitter();
    notificationService = {} as NotificationService;

    shortcutService = {} as ShortcutService;
    shortcutAssignSubject = new Subject<void>();
    shortcutUnassignSubject = new Subject<void>();
    shortcutDoneSubject = new Subject<void>();
    shortcutJosmSubject = new Subject<void>();
    shortcutIdSubject = new Subject<void>();

    shortcutService.add = jest.fn().mockImplementation(keys => {
      switch (keys) {
        case 'a':
          return shortcutAssignSubject.asObservable();
        case 'shift.a':
          return shortcutUnassignSubject.asObservable();
        case 'd':
          return shortcutDoneSubject.asObservable();
        case 'j':
          return shortcutJosmSubject.asObservable();
        case 'i':
          return shortcutIdSubject.asObservable();
      }
    });

    translationService = {} as TranslateService;

    return MockBuilder(TaskDetailsComponent, AppModule)
      .provide({provide: TaskService, useFactory: () => taskService})
      .provide({provide: CurrentUserService, useFactory: () => currentUserService})
      .provide({provide: UserService, useFactory: () => userService})
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: ShortcutService, useFactory: () => shortcutService})
      .provide({provide: TranslateService, useFactory: () => translationService});
  });

  beforeEach(() => {
    fixture = MockRender(TaskDetailsComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('with task service mocked functions', () => {
    beforeEach(() => {
      taskService.assign = jest.fn().mockImplementation((id: string) => {
        const task = createTask(10, id);
        task.assignedUser = new User('Foo', testUserId);
        taskService.selectedTaskChanged.emit(task);
        return of(task);
      });
      taskService.unassign = jest.fn().mockImplementation((id: string) => {
        const task = createTask(10, id);
        task.assignedUser = undefined;
        taskService.selectedTaskChanged.emit(task);
        return of(task);
      });
      taskService.setProcessPoints = jest.fn().mockImplementation((id: string, points: number) => {
        const task = createTask(points, id);
        task.processPoints = points;
        taskService.selectedTaskChanged.emit(task);
        return of(task);
      });

      component.task = createTask(10);
    });

    it('should assign and update task', () => {
      component.onAssignButtonClicked();

      fixture.detectChanges();
      expect(component.task?.assignedUser?.uid).toEqual(testUserId);
    });

    it('should unassign and update task', () => {
      // @ts-ignore
      component.task.assignedUser = new User('Foo', testUserId);
      component.onUnassignButtonClicked();

      fixture.detectChanges();
      // @ts-ignore
      expect(component.task.assignedUser).toEqual(undefined);
    });

    it('should set process points', () => {
      component.newProcessPoints = 50;
      component.onSaveButtonClick();

      fixture.detectChanges();
      // @ts-ignore
      expect(component.task.processPoints).toEqual(50);
    });

    it('should set all process points on done-button', () => {
      component.newProcessPoints = 50;
      component.onDoneButtonClick();

      fixture.detectChanges();
      // @ts-ignore
      expect(component.task.processPoints).toEqual(component.task.maxProcessPoints);
    });
  });

  it('should update tasks on updated project', () => {
    // Arrange
    const oldTask: Task = createTask(10);
    const newTask = createTask(50);
    component.task = oldTask;

    // Act
    // Update task, this would normally happen via websocket events.
    taskService.selectedTaskChanged.next(newTask);

    // Assert
    expect(component.task).toEqual(newTask);
    expect(component.newProcessPoints).toEqual(newTask.processPoints);
  });

  describe('with task and shortcuts', () => {
    beforeEach(() => {
      component.task = createTask(10);
    });

    describe('assign shortcut', () => {
      beforeEach(() => {
        taskService.assign = jest.fn().mockImplementation((id: string) => {
          const task = createTask(10, id);
          task.assignedUser = new User('Foo', testUserId);
          taskService.selectedTaskChanged.emit(task); // emitting change event is important here
          return of(task);
        });
      });

      describe('with user assignment needed', () => {
        beforeEach(() => {
          component.needUserAssignment = true;
        });

        describe('without assigned user', () => {
          it('should assign current user on shortcut', () => {
            shortcutAssignSubject.next();

            expect(taskService.assign).toHaveBeenCalledWith(testUserId);
          });

          it('should not assign current user on same shortcut twice', () => {
            shortcutAssignSubject.next();
            shortcutAssignSubject.next();

            expect(taskService.assign).toHaveBeenCalledTimes(1);
            expect(taskService.assign).toHaveBeenCalledWith(testUserId);
          });
        });

        describe('with already assigned user', () => {
          beforeEach(() => {
            // @ts-ignore
            component.task.assignedUser = new User('Peter', testUserId);
          });

          it('should not assign current user on shortcut', () => {
            shortcutAssignSubject.next();

            expect(taskService.assign).not.toHaveBeenCalled();
          });
        });
      });

      describe('without user assignment needed', () => {
        it('should not assign current user on shortcut', () => {
          shortcutAssignSubject.next();

          expect(taskService.assign).not.toHaveBeenCalled();
        });
      });
    });

    describe('unassign shortcut', () => {
      describe('without no user assignment needed', () => {
        beforeEach(() => {
          // @ts-ignore
          component.task.assignedUser = new User('Peter', testUserId);
          component.needUserAssignment = false;
        });

        it('should not unassign current user on shortcut', () => {
          taskService.unassign = jest.fn();

          shortcutUnassignSubject.next();

          expect(taskService.unassign).not.toHaveBeenCalled();
        });
      });

      describe('with user assignment needed', () => {
        beforeEach(() => {
          taskService.unassign = jest.fn().mockImplementation((id: string) => {
            const task = createTask(10, id);
            task.assignedUser = undefined;
            taskService.selectedTaskChanged.emit(task); // emitting change event is important here
            return of(task);
          });

          component.needUserAssignment = true;
        });

        describe('with current user assigned', () => {
          beforeEach(() => {
            // @ts-ignore
            component.task.assignedUser = new User('Peter', testUserId);
          });

          it('should unassign current user on shortcut', () => {
            shortcutUnassignSubject.next();

            // @ts-ignore
            expect(taskService.unassign).toHaveBeenCalledWith(component.task.id);
          });

          it('should not unassign current user on same shortcut twice', () => {
            shortcutUnassignSubject.next();
            shortcutUnassignSubject.next();

            expect(taskService.unassign).toHaveBeenCalledTimes(1);
            // @ts-ignore
            expect(taskService.unassign).toHaveBeenCalledWith(component.task.id);
          });
        });

        describe('with other user assigned', () => {
          beforeEach(() => {
            // @ts-ignore
            component.task.assignedUser = new User('Peter', 'some other id 789');
          });

          it('should not assign current user on shortcut', () => {
            shortcutUnassignSubject.next();

            expect(taskService.unassign).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('mark as done shortcut', () => {
      beforeEach(() => {
        taskService.setProcessPoints = jest.fn().mockReturnValue(of());
      });

      it('should mark task as done on shortcut', () => {
        shortcutDoneSubject.next();

        // @ts-ignore
        expect(taskService.setProcessPoints).toHaveBeenCalledWith(component.task.id, component.task.maxProcessPoints);
      });

      it('should not mark task as done on same shortcut twice', () => {
        shortcutDoneSubject.next();
        shortcutDoneSubject.next();

        // @ts-ignore
        expect(taskService.setProcessPoints).toHaveBeenCalledWith(component.task.id, component.task.maxProcessPoints);
      });
    });

    describe('open in JOSM shortcut', () => {
      beforeEach(() => {
        component.projectId = '42';
      });

      it('should open task in JOSM on shortcut', () => {
        taskService.openInJosm = jest.fn().mockReturnValue(of());

        shortcutJosmSubject.next();

        // @ts-ignore
        expect(taskService.openInJosm).toHaveBeenCalledWith(component.task);
      });
    });

    describe('open in iD shortcut', () => {
      beforeEach(() => {
        component.projectId = '42';
      });

      it('should open task in iD on shortcut', () => {
        taskService.openInOsmOrg = jest.fn().mockReturnValue(of());

        shortcutIdSubject.next();

        // @ts-ignore
        expect(taskService.openInOsmOrg).toHaveBeenCalledWith(component.task, component.projectId);
      });
    });
  });

  function createTask(processPoints: number, id: string = '123'): Task {
    return new Task(id, '', processPoints, 789, TestTaskFeature);
  }
});
