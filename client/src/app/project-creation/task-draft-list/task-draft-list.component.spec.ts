import { TaskDraftListComponent } from './task-draft-list.component';
import { TaskDraftService } from '../task-draft.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(TaskDraftListComponent.name, () => {
  let component: TaskDraftListComponent;
  let fixture: MockedComponentFixture<TaskDraftListComponent>;
  let taskDraftService: TaskDraftService;

  beforeEach(() => {
    taskDraftService = {} as TaskDraftService;

    return MockBuilder(TaskDraftListComponent, AppModule)
      .provide({provide: TaskDraftService, useFactory: () => taskDraftService});
  });

  beforeEach(() => {
    fixture = MockRender(TaskDraftListComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select task on service', () => {
    taskDraftService.selectTask = jest.fn();

    component.onTaskClicked('123');

    expect(taskDraftService.selectTask).toHaveBeenCalledWith('123');
  });
});
