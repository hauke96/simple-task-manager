import { TaskEditComponent } from './task-edit.component';
import { TaskDraftService } from '../task-draft.service';
import { TaskDraft } from '../../task/task.material';
import { Polygon } from 'ol/geom';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(TaskEditComponent.name, () => {
  let component: TaskEditComponent;
  let fixture: MockedComponentFixture<TaskEditComponent>;
  let taskDraftService: TaskDraftService;

  beforeEach(() => {
    taskDraftService = {} as TaskDraftService;

    return MockBuilder(TaskEditComponent, AppModule)
      .provide({provide: TaskDraftService, useFactory: () => taskDraftService});
  });

  beforeEach(() => {
    fixture = MockRender(TaskEditComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call rename function on service', () => {
    taskDraftService.changeTaskName = jest.fn();

    component.task = new TaskDraft('123', 'some name', new Polygon([]), 0);
    component.onTaskNameChanged({target: {value: 'new name'} as unknown as EventTarget} as Event);

    expect(taskDraftService.changeTaskName).toHaveBeenCalledWith('123', 'new name');
  });
});
