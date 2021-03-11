import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShapeDivideComponent } from './shape-divide.component';
import { FormsModule } from '@angular/forms';
import { Polygon } from 'ol/geom';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';
import { ConfigProvider } from '../../config/config.provider';

describe('ShapeDivideComponent', () => {
  let component: ShapeDivideComponent;
  let taskDraftService: TaskDraftService;
  let fixture: ComponentFixture<ShapeDivideComponent>;
  let configProvider: ConfigProvider;
  let spyRemove;
  let spyAdd;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [ShapeDivideComponent],
      providers: [TaskDraftService]
    })
      .compileComponents();

    taskDraftService = TestBed.inject(TaskDraftService);
    configProvider = TestBed.inject(ConfigProvider);
    configProvider.maxTasksPerProject = 1000;

    spyRemove = spyOn(taskDraftService, 'removeTask');
    spyAdd = spyOn(taskDraftService, 'addTasks');
    // @ts-ignore
    taskDraftService.selectedTask = new TaskDraft('123', undefined, undefined);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeDivideComponent);
    component = fixture.componentInstance;

    component.selectedTask = new TaskDraft('0', 'foo', new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    component.gridCellSize = 100;
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

    expect(spyRemove).toHaveBeenCalledWith('123');
    expect(spyAdd).toHaveBeenCalled();
  });

  it('should not divide anything on invalid shape type', () => {
    // Execute the same test for these NOT supported shapes
    ['fooGrid', null, 0, undefined].forEach(g => {
      component.gridCellShape = '' + g;
      component.onDivideButtonClicked();
    });

    expect(spyRemove).not.toHaveBeenCalled();
    expect(spyAdd).not.toHaveBeenCalled();
  });

  it('should not divide anything on invalid shape size', () => {
    // Execute the same test for these NOT supported sizes
    [null, undefined, -1, -100].forEach(g => {
      component.gridCellSize = g;
      component.onDivideButtonClicked();
    });

    expect(spyRemove).not.toHaveBeenCalled();
    expect(spyAdd).not.toHaveBeenCalled();
  });
});
