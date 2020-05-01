import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from './project.service';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Attribution, defaults as defaultControls, ScaleLine } from 'ol/control';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import { ErrorService } from '../common/error.service';
import GeometryType from 'ol/geom/GeometryType';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss']
})
export class ProjectCreationComponent implements OnInit, AfterViewInit {
  public newProjectName: string;
  public newMaxProcessPoints: number;
  public gridCellSize: number;
  public gridCellShape: string;
  public lastDrawnPolygon: Feature;

  private map: Map;
  private vectorSource: VectorSource;

  constructor(
    private projectService: ProjectService,
    private errorService: ErrorService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Choose some default values
    this.newMaxProcessPoints = 100;
    this.gridCellShape = 'squareGrid';
    this.gridCellSize = 1000;
  }

  ngAfterViewInit(): void {
    // Simple style function the the polygons
    const style = (feature, resolution) => {
      const borderColor = '#26a69a90';
      const fillColor = '#80cbc430';

      return new Style({
        stroke: new Stroke({
          color: borderColor,
          width: 2,
        }),
        fill: new Fill({
          color: fillColor
        })
      });
    };

    // this vector source contains all the task geometries
    this.vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style
    });

    this.map = new Map({
      target: 'map',
      controls: defaultControls().extend([
        new ScaleLine(),
        new Attribution()
      ]),
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: [1110161, 7085688],
        projection: 'EPSG:3857',
        zoom: 14,
        minZoom: 0,
        maxZoom: 19
      })
    });

    const draw = new Draw({
      source: this.vectorSource,
      type: GeometryType.POLYGON
    });
    draw.on('drawend', evt => {
      this.lastDrawnPolygon = evt.feature;
    });
    this.map.addInteraction(draw);
  }

  // See if the vector layer has some features.
  public get hasTasks(): boolean {
    return !!this.vectorSource && this.vectorSource.getFeatures().length !== 0;
  }

  public onSaveButtonClicked() {
    const polygons: Polygon[] = this.vectorSource.getFeatures().map(f => {
      let polygon = (f.getGeometry() as Polygon);

      // Even though we transformed the coordinates after their creation from EPSG:4326 into EPSG:3857, the OSM- and overall Geo-World works
      // with lat/lon values, so we transform it back.
      polygon = polygon.transform('EPSG:3857', 'EPSG:4326') as Polygon;

      // The openlayers "Polygon" Class can contain multiple rings. Because the
      // user just draws things, there only exist polygons having only one ring.
      // Therefore we take the first and only ring as our task geometry.
      return polygon;
    });

    this.createProject(this.newProjectName, this.newMaxProcessPoints, polygons);
  }

  public createProject(name: string, maxProcessPoints: number, polygons: Polygon[]) {
    this.projectService.createNewProject(name, maxProcessPoints, polygons.map(p => p.getCoordinates()[0]) as [number, number][][])
      .subscribe(project => {
        this.router.navigate(['/manager']);
      }, e => {
        this.errorService.addError('Could not create project');
      });
  }

// This function expects the geometry to be in the EPSG:4326 projection.
  onShapesCreated(features: Feature[]) {
    // Transform geometries into the correct projection
    features.forEach(f => {
      f.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    });

    this.vectorSource.refresh(); // clears the source
    features.forEach(f => this.vectorSource.addFeature(f));
  }
}
