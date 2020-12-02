import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShapeDivideComponent } from './shape-divide.component';
import { FormsModule } from '@angular/forms';
import { Polygon } from 'ol/geom';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';

describe('ShapeDivideComponent', () => {
  let component: ShapeDivideComponent;
  let taskDraftService: TaskDraftService;
  let fixture: ComponentFixture<ShapeDivideComponent>;

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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeDivideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit event when clicked on divide button', () => {
    const spyRemove = spyOn(taskDraftService, 'removeTask');
    const spyAdd = spyOn(taskDraftService, 'addTasks');
    // @ts-ignore
    taskDraftService.selectedTask = new TaskDraft('123', undefined, undefined);

    const geometry = new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]);
    component.selectedTask = new TaskDraft('0', 'foo', geometry);
    component.gridCellSize = 100;

    // Execute the same test for all supported shapes
    ['squareGrid', 'hexGrid', 'triangleGrid'].forEach(g => {
      component.gridCellShape = g;
      component.onDivideButtonClicked();
    });

    expect(spyRemove).toHaveBeenCalledWith('123');
    expect(spyAdd).toHaveBeenCalled();
  });

  it('should not divide anything on invalid shape type', () => {
    const spyRemove = spyOn(taskDraftService, 'removeTask');
    const spyAdd = spyOn(taskDraftService, 'addTasks');

    component.selectedTask = new TaskDraft('0', 'foo', new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    component.gridCellSize = 100;

    // Execute the same test for these NOT supported shapes
    ['fooGrid', null, 0, undefined].forEach(g => {
      component.gridCellShape = '' + g;
      component.onDivideButtonClicked();
    });


    expect(spyRemove).not.toHaveBeenCalled();
    expect(spyAdd).not.toHaveBeenCalled();
  });

  it('should not divide anything on invalid shape size', () => {
    const spyRemove = spyOn(taskDraftService, 'removeTask');
    const spyAdd = spyOn(taskDraftService, 'addTasks');

    component.selectedTask = new TaskDraft('0', 'foo', new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    component.gridCellShape = 'squareGrid';

    // Execute the same test for these NOT supported shapes
    [null, undefined, -1, -100].forEach(g => {
      component.gridCellSize = g;
      component.onDivideButtonClicked();
    });

    expect(spyRemove).not.toHaveBeenCalled();
    expect(spyAdd).not.toHaveBeenCalled();
  });
});
