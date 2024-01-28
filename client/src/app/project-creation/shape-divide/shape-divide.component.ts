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
    return !this.estimatedResultTooLarge && this.amountTasksAfterDividing <= this.maxTasksPerProject;
  }

  public get maxTasksPerProject(): number {
    return this.config.maxTasksPerProject;
  }

  public get amountTasksAfterDividing(): number {
    // The existing tasks - the one task that should be divided + the amount of new tasks
    return this.taskDraftService.getTasks().length - 1 + this.previewTasks.length;
  }

  public onPreviewWanted(): void {
    this.previewClicked.emit(this.previewTasks);
  }

  public onDivideButtonClicked(): void {
    if (!this.canDivideTasks) {
      throw new Error('Dividing tasks should not be able');
    }

    const taskDrafts = this.createTaskDrafts();
    if (!taskDrafts) {
      return;
    }

    const selectedTaskId = this.taskDraftService.getSelectedTask()?.id;
    if (!selectedTaskId) {
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
      const e = `Invalid cell size ${this.gridCellSize}`;
      console.error(e);
      this.notificationService.addError(e);
      return undefined;
    }

    const grid = this.createGrid(extent, cellSize, options);
    if (!grid) {
      return undefined;
    }

    if (this.estimateCellCount() > this.TASK_ESTIMATION_TOLERANCE * this.maxTasksPerProject) {
      this.estimatedResultTooLarge = true;
      return undefined;
    }
    this.estimatedResultTooLarge = false;

    console.log(grid);

    return grid.features.map((gridCell: any) => {
      // Turn geo GeoJSON polygon from turf.js into an openlayers polygon
      const geometry = new Polygon(gridCell.geometry.coordinates);

      return new TaskDraft('', '', geometry, 0);
    });
  }

  private estimateCellCount(): number {
    let scale = 1;

    switch (this.gridCellShape) {
      case 'hexGrid':
        // The cell size specified the "radius" of the hexagon
        scale = 4;
        break;
      case 'triangleGrid':
        scale = 0.5;
        break;
    }

    console.log('Get area');
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
    console.log('Got area', area, area / (Math.pow(this.gridCellSize, 2) * scale));

    return area / (Math.pow(this.gridCellSize, 2) * scale);
  }

  private createGrid(extent: BBox.BBox, cellSize: number, options: any): any {
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
    this.onPreviewWanted();
  }
}
