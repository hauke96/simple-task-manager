import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import BBox, { Feature as TurfFeature, multiPolygon as turfMultiPolygon, polygon as turfPolygon, Units } from '@turf/helpers';
import squareGrid from '@turf/square-grid';
import hexGrid from '@turf/hex-grid';
import triangleGrid from '@turf/triangle-grid';
import { MultiPolygon, Polygon } from 'ol/geom';
import { NotificationService } from '../../common/services/notification.service';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';
import { ConfigProvider } from '../../config/config.provider';

@Component({
  selector: 'app-shape-divide',
  templateUrl: './shape-divide.component.html',
  styleUrls: ['./shape-divide.component.scss']
})
export class ShapeDivideComponent implements OnInit {
  private readonly TASK_ESTIMATION_TOLERANCE = 10;

  public gridCellSize: number;
  public gridCellShape: string;
  public previewTasks: TaskDraft[] = [];
  public estimatedResultTooLarge: boolean;
  public previewModeActive: boolean;

  @Input() public selectedTask: TaskDraft;

  @Output() previewClicked: EventEmitter<TaskDraft[]> = new EventEmitter<TaskDraft[]>();

  constructor(
    private notificationService: NotificationService,
    private taskDraftService: TaskDraftService,
    private config: ConfigProvider
  ) {
  }

  ngOnInit(): void {
    this.gridCellShape = 'squareGrid';
    this.gridCellSize = 1000;
    this.previewTasks = this.createTaskDrafts() ?? [];
  }

  public get canDivideTasks(): boolean {
    return !this.isResultTooLarge && !this.isPreviewEmpty;
  }

  public get isResultTooLarge(): boolean {
    return this.estimatedResultTooLarge || this.amountTasksAfterDividing > this.maxTasksPerProject;
  }

  public get isPreviewEmpty(): boolean {
    return !this.previewTasks || this.previewTasks.length === 0;
  }

  public get maxTasksPerProject(): number {
    return this.config.maxTasksPerProject;
  }

  public get amountTasksAfterDividing(): number {
    // The existing tasks - the one task that should be divided + the amount of new tasks
    return this.taskDraftService.getTasks().length - 1 + this.previewTasks.length;
  }

  public onPreviewWanted(): void {
    this.previewModeActive = !this.previewModeActive;
    this.notifyPreview();
  }

  private notifyPreview(): void {
    if (this.previewModeActive && this.canDivideTasks) {
      this.previewClicked.emit(this.previewTasks);
    } else {
      this.previewClicked.emit([]);
    }
  }

  public onDivideButtonClicked(): void {
    if (!this.canDivideTasks) {
      this.notificationService.addError("Dividing tasks is not possible (e.g. the number of resulting tasks is too low or too high).")
      return;
    }

    const taskDrafts = this.createTaskDrafts();
    if (!taskDrafts || taskDrafts.length === 0) {
      this.notificationService.addWarning("Cannot subdivide task: The resulted subdivision was empty.")
      return;
    }

    const selectedTaskId = this.taskDraftService.getSelectedTask()?.id;
    if (!selectedTaskId) {
      this.notificationService.addError("Cannot subdivide task: No tasks is currently selected.")
      return;
    }

    this.taskDraftService.removeTask(selectedTaskId);
    this.taskDraftService.addTasks(taskDrafts, true);
  }

  /**
   * This just creates the tasks but does not add them to the TaskDraftService.
   */
  private createTaskDrafts(): TaskDraft[] | undefined {
    const selectedTaskGeometry = this.selectedTask.geometry.clone();
    selectedTaskGeometry.transform('EPSG:3857', 'EPSG:4326');
    const extent = selectedTaskGeometry.getExtent() as BBox.BBox;

    let feature: TurfFeature<any>;
    switch (this.selectedTask.geometry.getType()) {
      case 'Polygon':
        feature = turfPolygon((selectedTaskGeometry as Polygon).getCoordinates());
        break;
      case 'MultiPolygon':
        feature = turfMultiPolygon((selectedTaskGeometry as MultiPolygon).getCoordinates());
        break;
      default:
        throw new Error(`Unsupported task geometry type '${this.selectedTask.geometry.getType()}'`);
    }

    // Use meters and only show grid cells within the original polygon (-> mask)
    const options = {
      units: 'meters' as Units,
      mask: feature,
    };

    const cellSize = this.gridCellSize;
    if (!(cellSize > 0)) {
      console.error(`Invalid cell size ${this.gridCellSize}`);
      return undefined;
    }

    if (!(cellSize > 0)) {
      console.error(`Invalid cell size ${this.gridCellSize}`);
      return undefined;
    }

    if (this.estimateCellCount() > this.TASK_ESTIMATION_TOLERANCE * this.maxTasksPerProject) {
      this.estimatedResultTooLarge = true;
      return undefined;
    }
    this.estimatedResultTooLarge = false;

    const grid = this.createGrid(extent, cellSize, options);
    if (!grid) {
      return undefined;
    }

    return grid.features.map((gridCell: any) => {
      // Turn geo GeoJSON polygon from turf.js into an openlayers polygon
      const geometry = new Polygon(gridCell.geometry.coordinates);

      return new TaskDraft('', '', geometry, 0);
    });
  }

  private estimateCellCount(): number {
    let areaPerTargetTask = 0;
    switch (this.gridCellShape) {
      case 'squareGrid':
        areaPerTargetTask = Math.pow(this.gridCellSize, 2);
        break;
      case 'hexGrid':
        areaPerTargetTask = Math.sqrt(3/2) * Math.pow(this.gridCellSize, 2);
        break;
      case 'triangleGrid':
        areaPerTargetTask = 0.5 * Math.pow(this.gridCellSize, 2);
        break;
    }

    return this.getAreaOfSelectedTask() / areaPerTargetTask;
  }

  private getAreaOfSelectedTask() {
    let area = 0;
    switch (this.selectedTask.geometry.getType()) {
      case 'Polygon':
        area = (this.selectedTask.geometry as Polygon).getArea();
        break;
      case 'MultiPolygon':
        area = (this.selectedTask.geometry as MultiPolygon).getArea();
        break;
      default:
        throw new Error(`Unsupported task geometry type '${this.selectedTask.geometry.getType()}'`);
    }
    return area;
  }

  private createGrid(extent: BBox.BBox, cellSize: number, options: any): BBox.FeatureCollection | undefined {
    switch (this.gridCellShape) {
      case 'squareGrid':
        return squareGrid(extent, cellSize, options);
      case 'hexGrid':
        return hexGrid(extent, cellSize, options);
      case 'triangleGrid':
        return triangleGrid(extent, cellSize, options);
    }

    const e = `Unknown shape type ${this.gridCellShape}`;
    console.error(e);
    this.notificationService.addError(e);
    return undefined;
  }

  public taskDividePropertyChanged(): void {
    this.previewTasks = this.createTaskDrafts() ?? [];
    this.previewTasks.forEach(t => t.geometry.transform('EPSG:4326', 'EPSG:3857'));
    this.notifyPreview();
  }
}
