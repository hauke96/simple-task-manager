import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TaskDetailsComponent } from './task-details.component';
import { CurrentUserService } from '../../user/current-user.service';
import { TaskService } from '../task.service';
import { Task, TestTaskFeature } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { WebsocketClientService } from '../../common/websocket-client.service';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.material';
import { TaskTitlePipe } from '../task-title.pipe';
import { ShortcutService } from '../../common/shortcut.service';

describe('TaskDetailsComponent', () => {
  let component: TaskDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;
  let websocketService: WebsocketClientService;
  let userService: UserService;
  let shortcutService: ShortcutService;
  const testUserId = '123';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TaskDetailsComponent, TaskTitlePipe],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        CurrentUserService,
        TaskService
      ]
    })
      .compileComponents();

    taskService = TestBed.inject(TaskService);

    currentUserService = TestBed.inject(CurrentUserService);
    spyOn(currentUserService, 'getUserId').and.returnValue(testUserId);

    userService = TestBed.inject(UserService);
    spyOn(userService, 'getUsersByIds').and.returnValue(of([new User('Foo', testUserId)]));

    websocketService = TestBed.inject(WebsocketClientService);
    shortcutService = TestBed.inject(ShortcutService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('with task service mocked functions', () => {
    beforeEach(() => {
      spyOn(taskService, 'assign').and.callFake((id: string) => {
        const task = createTask(10, id);
        task.assignedUser = new User('Foo', testUserId);
        taskService.selectedTaskChanged.emit(task);
        return of(task);
      });
      spyOn(taskService, 'unassign').and.callFake((id: string) => {
        const task = createTask(10, id);
        task.assignedUser = undefined;
        taskService.selectedTaskChanged.emit(task);
        return of(task);
      });
      spyOn(taskService, 'setProcessPoints').and.callFake((id: string, points: number) => {
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
      expect(component.task.assignedUser.uid).toEqual(testUserId);
    });

    it('should unassign and update task', () => {
      component.task.assignedUser = new User('Foo', testUserId);
      component.onUnassignButtonClicked();

      fixture.detectChanges();
      expect(component.task.assignedUser).toEqual(undefined);
    });

    it('should set process points', () => {
      component.newProcessPoints = 50;
      component.onSaveButtonClick();

      fixture.detectChanges();
      expect(component.task.processPoints).toEqual(50);
    });

    it('should set all process points on done-button', () => {
      component.newProcessPoints = 50;
      component.onDoneButtonClick();

      fixture.detectChanges();
      expect(component.task.processPoints).toEqual(component.task.maxProcessPoints);
    });
  });

  it('should update tasks on updated project', () => {
    const t: Task = createTask(10);
    const newProcessPoints = 50;

    taskService.selectTask(t);
    component.task = t;

    // Update task, this would normally happen via websocket events.
    taskService.updateTasks([createTask(newProcessPoints)]);

    expect(component.task.processPoints).toEqual(newProcessPoints);
  });

  describe('with shortcuts', () => {
    let shortcutAssignSubject: Subject<void>;
    let shortcutUnassignSubject: Subject<void>;
    let shortcutDoneSubject: Subject<void>;
    let shortcutJosmSubject: Subject<void>;
    let shortcutIdSubject: Subject<void>;

    beforeEach(() => {
      shortcutAssignSubject = new Subject<void>();
      shortcutUnassignSubject = new Subject<void>();
      shortcutDoneSubject = new Subject<void>();
      shortcutJosmSubject = new Subject<void>();
      shortcutIdSubject = new Subject<void>();

      spyOn(shortcutService, 'add')
        .withArgs('a').and.returnValue(shortcutAssignSubject.asObservable())
        .withArgs('u').and.returnValue(shortcutUnassignSubject.asObservable())
        .withArgs('d').and.returnValue(shortcutDoneSubject.asObservable())
        .withArgs('j').and.returnValue(shortcutJosmSubject.asObservable())
        .withArgs('i').and.returnValue(shortcutIdSubject.asObservable());

      fixture = TestBed.createComponent(TaskDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.task = createTask(10);
    });

    describe('assign shortcut', () => {
      let spy;

      beforeEach(() => {
        spy = spyOn(taskService, 'assign').and.callFake((id: string) => {
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

            expect(spy).toHaveBeenCalledWith(testUserId);
          });

          it('should not assign current user on same shortcut twice', () => {
            shortcutAssignSubject.next();
            shortcutAssignSubject.next();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(testUserId);
          });
        });

        describe('with already assigned user', () => {
          beforeEach(() => {
            component.task.assignedUser = new User('Peter', testUserId);
          });

          it('should not assign current user on shortcut', () => {
            shortcutAssignSubject.next();

            expect(spy).not.toHaveBeenCalled();
          });
        });
      });

      describe('without user assignment needed', () => {
        it('should not assign current user on shortcut', () => {
          shortcutAssignSubject.next();

          expect(spy).not.toHaveBeenCalled();
        });
      });
    });

    describe('unassign shortcut', () => {
      describe('without no user assignment needed', () => {
        beforeEach(() => {
          component.task.assignedUser = new User('Peter', testUserId);
          component.needUserAssignment = false;
        });

        it('should not unassign current user on shortcut', () => {
          const spy = spyOn(taskService, 'unassign');

          shortcutUnassignSubject.next();

          expect(spy).not.toHaveBeenCalled();
        });
      });
      describe('with user assignment needed', () => {
        let spy;
        beforeEach(() => {
          spy = spyOn(taskService, 'unassign').and.callFake((id: string) => {
            const task = createTask(10, id);
            task.assignedUser = undefined;
            taskService.selectedTaskChanged.emit(task); // emitting change event is important here
            return of(task);
          });

          component.needUserAssignment = true;
        });

        describe('with current user assigned', () => {
          beforeEach(() => {
            component.task.assignedUser = new User('Peter', testUserId);
          });

          it('should unassign current user on shortcut', () => {
            shortcutUnassignSubject.next();

            expect(spy).toHaveBeenCalledWith(component.task.id);
          });

          it('should not unassign current user on same shortcut twice', () => {
            shortcutUnassignSubject.next();
            shortcutUnassignSubject.next();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(component.task.id);
          });
        });

        describe('with other user assigned', () => {
          beforeEach(() => {
            component.task.assignedUser = new User('Peter', 'some other id 789');
          });

          it('should not assign current user on shortcut', () => {
            shortcutUnassignSubject.next();

            expect(spy).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('mark as done shortcut', () => {
      let spy;

      beforeEach(() => {
        spy = spyOn(taskService, 'setProcessPoints').and.returnValue(of());
      });

      it('should mark task as done on shortcut', () => {
        shortcutDoneSubject.next();

        expect(spy).toHaveBeenCalledWith(component.task.id, component.task.maxProcessPoints);
      });

      it('should not mark task as done on same shortcut twice', () => {
        shortcutDoneSubject.next();
        shortcutDoneSubject.next();

        expect(spy).toHaveBeenCalledWith(component.task.id, component.task.maxProcessPoints);
      });
    });

    describe('open in JOSM shortcut', () => {
      beforeEach(() => {
        component.projectId = '42';
      });

      it('should open task in JOSM on shortcut', () => {
        const spy = spyOn(taskService, 'openInJosm').and.returnValue(of());

        shortcutJosmSubject.next();

        expect(spy).toHaveBeenCalledWith(component.task, component.projectId);
      });
    });

    describe('open in iD shortcut', () => {
      beforeEach(() => {
        component.projectId = '42';
      });

      it('should open task in iD on shortcut', () => {
        const spy = spyOn(taskService, 'openInOsmOrg');

        shortcutIdSubject.next();

        expect(spy).toHaveBeenCalledWith(component.task, component.projectId);
      });
    });
  });

  function createTask(processPoints: number, id: string = '123'): Task {
    return new Task(id, undefined, processPoints, 789, TestTaskFeature);
  }
});
