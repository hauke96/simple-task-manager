import { ShapeDivideComponent } from './shape-divide.component';
import { MultiPolygon, Point, Polygon } from 'ol/geom';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';
import { ConfigProvider } from '../../config/config.provider';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../common/services/notification.service';
import Mock = jest.Mock;

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

  describe('Simple polygon', () => {
    beforeEach(() => {
      const taskDraft = new TaskDraft('0', 'foo', new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]), 0);
      fixture = MockRender(ShapeDivideComponent, {selectedTask: taskDraft});
      component = fixture.point.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    // Execute the same test for all supported shapes
    ['squareGrid', 'hexGrid', 'triangleGrid'].forEach(s => {
      it(`should emit event when clicked on divide button for '${s}' shape`, () => {
        // Arrange
        notificationService.addError = jest.fn();
        component.gridCellShape = s;
        component.gridCellSize = 100;
        component.taskDividePropertyChanged();

        // Act
        component.onDivideButtonClicked();

        // Assert
        expect(taskDraftService.removeTask).toHaveBeenCalledWith('123');
        expect(taskDraftService.addTasks).toHaveBeenCalled();
        expect(notificationService.addError).not.toHaveBeenCalled();
      });
    });

    // Execute the same test for these NOT supported shapes
    ['', 'fooGrid', 'null', 'undefined', null, undefined].forEach(s => {
      it(`should not divide anything on shape type '${s}'`, () => {
        // Arrange
        notificationService.addError = jest.fn();
        component.gridCellShape = s as string;

        // Act
        component.onDivideButtonClicked();

        // Assert
        expect(taskDraftService.removeTask).not.toHaveBeenCalled();
        expect(taskDraftService.addTasks).not.toHaveBeenCalled();
        expect(notificationService.addError).toHaveBeenCalled();
      });
    });

    // Execute the same test for these NOT supported sizes
    [null, undefined, -1, -100].forEach(s => {
      it(`should not divide anything on invalid shape size '${s}'`, () => {
        // Arrange
        notificationService.addError = jest.fn();
        component.gridCellSize = s as number;

        // Act
        component.onDivideButtonClicked();

        // Assert
        expect(taskDraftService.removeTask).not.toHaveBeenCalled();
        expect(taskDraftService.addTasks).not.toHaveBeenCalled();
        expect(notificationService.addError).toHaveBeenCalled();
      });
    });
  });

  describe('MultiPolygon', () => {
    beforeEach(() => {
      // Square with hole on upper-right side in which no grid cells should be
      const geometry = new MultiPolygon([
        [
          [
            [
              -97.81975404685,
              30.52296049176
            ],
            [
              -97.80241036651,
              30.52289517707
            ],
            [
              -97.80247094574,
              30.51095758109
            ],
            [
              -97.81981462608,
              30.51102290380
            ],
            [
              -97.81975404685,
              30.52296049176
            ]
          ],
          [
            [
              -97.81375623181,
              30.52276567796
            ],
            [
              -97.80306602588,
              30.52273237916
            ],
            [
              -97.80310726874,
              30.51290662652
            ],
            [
              -97.81379747467,
              30.51293992869
            ],
            [
              -97.81375623181,
              30.52276567796
            ]
          ]
        ]
      ]);
      geometry.transform('EPSG:4326', 'EPSG:3857');

      const task = new TaskDraft('0', 'foo', geometry, 0);
      fixture = MockRender(ShapeDivideComponent, {selectedTask: task});
      component = fixture.point.componentInstance;
      fixture.detectChanges();
    });

    it('should create correct drafts on divide button click', () => {
      component.gridCellShape = 'squareGrid';
      component.gridCellSize = 350;
      component.onDivideButtonClicked();

      expect(taskDraftService.removeTask).toHaveBeenCalledWith('123');

      // Expect 8 cells on a 4x3 grid in which 4 cells are within the MultiPolygon hole
      console.log((taskDraftService.addTasks as Mock).mock.calls);
      const createdTaskDrafts = (taskDraftService.addTasks as Mock).mock.calls[0][0];
      expect(createdTaskDrafts.length).toEqual(9);
    });
  });
});
