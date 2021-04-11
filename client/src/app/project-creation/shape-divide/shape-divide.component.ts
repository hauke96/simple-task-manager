import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { polygon as turfPolygon, Units } from '@turf/helpers';
import squareGrid from '@turf/square-grid';
import hexGrid from '@turf/hex-grid';
import triangleGrid from '@turf/triangle-grid';
import { Polygon } from 'ol/geom';
import { NotificationService } from '../../common/notification.service';
import { TaskDraft } from '../../task/task.material';
import { TaskDraftService } from '../task-draft.service';
import { ConfigProvider } from '../../config/config.provider';

@Component({
  selector: 'app-shape-divide',
  templateUrl: './shape-divide.component.html',
  styleUrls: ['./shape-divide.component.scss']
})
export class ShapeDivideComponent implements OnInit {
  public gridCellSize: number;
  public gridCellShape: string;
  public previewTasks: TaskDraft[] = [];

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
    this.previewTasks = this.createTaskDrafts();
  }

  public get canDivideTasks(): boolean {
    return this.amountTasksAfterDividing <= this.maxTasksPerProject;
  }

  public get maxTasksPerProject() {
    return this.config.maxTasksPerProject;
  }

  public get amountTasksAfterDividing() {
    // The existing tasks - the one task that should be divided + the amount of new tasks
    return this.taskDraftService.getTasks().length - 1 + this.previewTasks.length;
  }

  onPreviewButtonClicked() {
    this.previewTasks.forEach(t => t.geometry.transform('EPSG:4326', 'EPSG:3857'));
    this.previewClicked.emit(this.previewTasks);
  }

  public onDivideButtonClicked() {
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
  private createTaskDrafts(): TaskDraft[] {
    const polygon = this.selectedTask.geometry.clone() as Polygon;
    const extent = polygon.transform('EPSG:3857', 'EPSG:4326').getExtent();

    // Use meters and only show grid cells within the original polygon (-> mask)
    const options = {
      units: 'meters' as Units,
      mask: turfPolygon(polygon.getCoordinates())
    };

    const cellSize = this.gridCellSize;
    if (!(cellSize > 0)) {
      const e = `Invalid cell size ${this.gridCellSize}`;
      console.error(e);
      this.notificationService.addError(e);
      return [];
    }

    let grid;
    switch (this.gridCellShape) {
      case 'squareGrid':
        grid = squareGrid(extent, cellSize, options);
        break;
      case 'hexGrid':
        grid = hexGrid(extent, cellSize, options);
        break;
      case 'triangleGrid':
        grid = triangleGrid(extent, cellSize, options);
        break;
      default:
        const e = `Unknown shape type ${this.gridCellShape}`;
        console.error(e);
        this.notificationService.addError(e);
        return [];
    }

    return grid.features.map(g => {
      // Turn geo GeoJSON polygon from turf.js into an openlayers polygon
      const geometry = new Polygon(g.geometry.coordinates);

      return new TaskDraft(undefined, '', geometry, 0);
    });
  }

  public taskDividePropertyChanged() {
    this.previewTasks = this.createTaskDrafts();
  }
}
