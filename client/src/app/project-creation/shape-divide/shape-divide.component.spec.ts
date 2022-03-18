import { ShapeDivideComponent } from './shape-divide.component';
import { Point, Polygon } from 'ol/geom';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';
import { ConfigProvider } from '../../config/config.provider';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../common/services/notification.service';

describe(ShapeDivideComponent.name, () => {
  let component: ShapeDivideComponent;
  let fixture: MockedComponentFixture<ShapeDivideComponent, any>;
  let notificationService: NotificationService;
  let taskDraftService: TaskDraftService;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    notificationService = {} as NotificationService;
    configProvider = {} as ConfigProvider;
    configProvider.maxTasksPerProject = 1000;

    taskDraftService = {} as TaskDraftService;
    taskDraftService.removeTask = jest.fn();
    taskDraftService.addTasks = jest.fn();
    taskDraftService.getTasks = jest.fn().mockReturnValue([]);
    const taskDraft = new TaskDraft('123', '', new Point([1, 2]), 100);
    // @ts-ignore
    taskDraftService.getSelectedTask = jest.fn().mockReturnValue(taskDraft);

    return MockBuilder(ShapeDivideComponent, AppModule)
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: TaskDraftService, useFactory: () => taskDraftService})
      .provide({provide: ConfigProvider, useFactory: () => configProvider});
  });

  beforeEach(() => {
    const taskDraft = new TaskDraft('0', 'foo', new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]), 0);
    fixture = MockRender(ShapeDivideComponent, {selectedTask: taskDraft});
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit event when clicked on divide button', () => {
    // Execute the same test for all supported shapes
    ['squareGrid', 'hexGrid', 'triangleGrid'].forEach(g => {
      component.gridCellShape = g;
      component.onDivideButtonClicked();
    });

    expect(taskDraftService.removeTask).toHaveBeenCalledWith('123');
    expect(taskDraftService.addTasks).toHaveBeenCalled();
  });

  // Execute the same test for these NOT supported shapes
  ['', 'fooGrid', 'null', 'undefined', null, undefined].forEach(g => {
    it(`should not divide anything on shape type '${g}'`, () => {
      // Arrange
      notificationService.addError = jest.fn();
      component.gridCellShape = g as string;

      // Act
      component.onDivideButtonClicked();

      // Assert
      expect(taskDraftService.removeTask).not.toHaveBeenCalled();
      expect(taskDraftService.addTasks).not.toHaveBeenCalled();
      expect(notificationService.addError).toHaveBeenCalled();
    });
  });

  // Execute the same test for these NOT supported sizes
  [null, undefined, -1, -100].forEach(g => {
    it(`should not divide anything on invalid shape size '${g}'`, () => {
      // Arrange
      notificationService.addError = jest.fn();
      component.gridCellSize = g as number;

      // Act
      component.onDivideButtonClicked();

      // Assert
      expect(taskDraftService.removeTask).not.toHaveBeenCalled();
      expect(taskDraftService.addTasks).not.toHaveBeenCalled();
      expect(notificationService.addError).toHaveBeenCalled();
    });
  });
});
