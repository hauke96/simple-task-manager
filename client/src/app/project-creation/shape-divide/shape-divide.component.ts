import { Component, Input, OnInit } from '@angular/core';
import { polygon as turfPolygon, Units } from '@turf/helpers';
import squareGrid from '@turf/square-grid';
import hexGrid from '@turf/hex-grid';
import triangleGrid from '@turf/triangle-grid';
import { Polygon } from 'ol/geom';
import { NotificationService } from '../../common/notification.service';
import { TaskDraft } from '../task-draft';
import { TaskDraftService } from '../task-draft.service';

@Component({
  selector: 'app-shape-divide',
  templateUrl: './shape-divide.component.html',
  styleUrls: ['./shape-divide.component.scss']
})
export class ShapeDivideComponent implements OnInit {
  public gridCellSize: number;
  public gridCellShape: string;

  @Input() public selectedTask: TaskDraft;

  constructor(
    private notificationService: NotificationService,
    private taskDraftService: TaskDraftService
  ) {
  }

  ngOnInit(): void {
    this.gridCellShape = 'squareGrid';
    this.gridCellSize = 1000;
  }

  public get hasSelectedPolygon(): boolean {
    return !!this.selectedTask;
  }

  public onDivideButtonClicked() {
    const polygon = this.selectedTask.geometry as Polygon;
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
      return;
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
        return;
    }

    const newTasks: TaskDraft[] = grid.features.map(g => {
      // Turn geo GeoJSON polygon from turf.js into an openlayers polygon
      const geometry = new Polygon(g.geometry.coordinates);

      return new TaskDraft(undefined, undefined, geometry);
    });

    this.taskDraftService.removeTask(this.taskDraftService.getSelectedTask().id);
    this.taskDraftService.addTasks(newTasks, true);
  }
}
