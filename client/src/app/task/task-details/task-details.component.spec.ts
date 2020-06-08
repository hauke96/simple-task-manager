import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailsComponent } from './task-details.component';
import { CurrentUserService } from '../../user/current-user.service';
import { TaskService } from '../task.service';
import { Task, TestTaskGeometry } from '../task.material';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProjectService } from '../../project/project.service';
import { Project, ProjectDto } from '../../project/project.material';
import { User } from '../../user/user.material';
import { WebsocketMessage, WebsocketMessageType } from '../../common/websocket-message';
import { WebsocketClientService } from '../../common/websocket-client.service';

describe('TaskDetailsComponent', () => {
  let component: TaskDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsComponent>;
  let taskService: TaskService;
  let currentUserService: CurrentUserService;
  let projectService: ProjectService;
  let websocketService: WebsocketClientService;
  let task: Task;
  const testUserId = '123';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TaskDetailsComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        CurrentUserService,
        TaskService,
        ProjectService
      ]
    })
      .compileComponents();

    task = new Task('t-42', 10, 100, TestTaskGeometry);

    taskService = TestBed.inject(TaskService);
    spyOn(taskService, 'assign').and.callFake((id: string) => {
      task.assignedUser = testUserId;
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });
    spyOn(taskService, 'unassign').and.callFake((id: string) => {
      task.assignedUser = '';
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });
    spyOn(taskService, 'setProcessPoints').and.callFake((id: string, points: number) => {
      task.processPoints = points;
      taskService.selectedTaskChanged.emit(task);
      return of(task);
    });

    currentUserService = TestBed.inject(CurrentUserService);
    spyOn(currentUserService, 'getUserId').and.returnValue(testUserId);

    projectService = TestBed.inject(ProjectService);
    websocketService = TestBed.inject(WebsocketClientService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign and update task', () => {
    component.task = task;
    component.onAssignButtonClicked();

    fixture.detectChanges();
    expect(component.task.assignedUser).toEqual(testUserId);
  });

  it('should unassign and update task', () => {
    task.assignedUser = testUserId;

    component.task = task;
    component.onUnassignButtonClicked();

    fixture.detectChanges();
    expect(component.task.assignedUser).toEqual('');
  });

  it('should set process points', () => {
    component.task = task;
    component.newProcessPoints = 50;
    component.onSaveButtonClick();

    fixture.detectChanges();
    expect(component.task.processPoints).toEqual(50);
  });

  it('should update tasks on updated project', () => {
    const p = createProject();
    const newProcessPoints = 50;

    taskService.selectTask(p.tasks[0]);
    component.task = p.tasks[0];

    // Change something on the task
    p.tasks[0] = new Task('567', newProcessPoints, 100, TestTaskGeometry);

    // Trigger update events when project service receives an updated project
    spyOn(projectService, 'toProject').and.returnValue(of(p));
    websocketService.messageReceived.emit(new WebsocketMessage(
      WebsocketMessageType.MessageType_ProjectUpdated,
      new ProjectDto(p.id, p.name, p.description, p.tasks.map(t => t.id), p.users.map(u => u.uid), p.owner.uid, p.needsAssignment)
    ));

    expect(component.task.processPoints).toEqual(newProcessPoints);
  });

  function createProject(): Project {
    const t = new Task('567', 10, 100, TestTaskGeometry);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }
});
