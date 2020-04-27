import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { polygon as turfPolygon, Units } from '@turf/helpers';
import squareGrid from '@turf/square-grid';
import hexGrid from '@turf/hex-grid';
import triangleGrid from '@turf/triangle-grid';
import { Polygon } from 'ol/geom';
import { Feature } from 'ol';
import { Task } from '../../task/task.material';

@Component({
  selector: 'app-shape-divide',
  templateUrl: './shape-divide.component.html',
  styleUrls: ['./shape-divide.component.scss']
})
export class ShapeDivideComponent implements OnInit {
  @Input() public gridCellSize: number;
  @Input() public gridCellShape: string;
  @Input() public lastDrawnPolygon: Feature;
  @Input() public hasTasks: boolean;

  @Output() public shapesCreated: EventEmitter<Feature[]> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  public onDivideButtonClicked() {
    const polygon = this.lastDrawnPolygon.getGeometry() as Polygon;
    const extent = polygon.transform('EPSG:3857', 'EPSG:4326').getExtent();

    // Use meters and only show grid cells within the original polygon (-> mask)
    const options = {
      units: 'meters' as Units,
      mask: turfPolygon(polygon.getCoordinates())
    };

    let grid;
    switch (this.gridCellShape) {
      case 'squareGrid':
        grid = squareGrid(extent, this.gridCellSize, options);
        break;
      case 'hexGrid':
        grid = hexGrid(extent, this.gridCellSize, options);
        break;
      case 'triangleGrid':
        grid = triangleGrid(extent, this.gridCellSize, options);
        break;
    }

    const newFeatures = grid.features.map(g => {
      // Turn geo GeoJSON polygon from turf.js into an openlayers polygon and
      // transform it into the used coordinate system.
      let geometry = new Polygon(g.geometry.coordinates);
      geometry = geometry.transform('EPSG:4326', 'EPSG:3857');

      // create the map feature and set the task-id to select the task when the
      // polygon has been clicked
      return new Feature(geometry);
    });

    this.shapesCreated.emit(newFeatures);
  }
}
