import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Attribution, defaults as defaultControls, ScaleLine } from 'ol/control';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import { ErrorService } from '../../common/error.service';
import GeometryType from 'ol/geom/GeometryType';
import { UserService } from '../../user/user.service';
import Snap from 'ol/interaction/Snap';
import Modify from 'ol/interaction/Modify';
import Select, { SelectEvent } from 'ol/interaction/Select';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss']
})
export class ProjectCreationComponent implements OnInit, AfterViewInit {
  // Project values
  public newProjectName: string;
  public newMaxProcessPoints: number;
  public projectDescription: string;

  // Polygon division values
  public gridCellSize: number;
  public gridCellShape: string;
  public lastDrawnPolygon: Feature;

  // public for tests
  public modifyInteraction: Modify;
  public drawInteraction: Draw;
  public selectInteraction: Select;
  public vectorSource: VectorSource;

  private map: Map;

  constructor(
    private projectService: ProjectService,
    private errorService: ErrorService,
    private userService: UserService,
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

    this.addMapInteractions();
  }

  private addMapInteractions() {
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: GeometryType.POLYGON
    });
    this.drawInteraction.on('drawend', evt => {
      this.lastDrawnPolygon = evt.feature;
      this.modifyInteraction.setActive(true);
    });
    this.drawInteraction.on('drawstart', evt => {
      // Disable modify interaction, otherwise it's not possible to click on existing nodes when drawing
      this.modifyInteraction.setActive(false);
    });
    this.map.addInteraction(this.drawInteraction);

    const snap = new Snap({
      source: this.vectorSource
    });
    this.map.addInteraction(snap);

    this.modifyInteraction = new Modify({
      source: this.vectorSource
    });
    this.map.addInteraction(this.modifyInteraction);

    this.selectInteraction = new Select();
    this.selectInteraction.setActive(false);
    this.selectInteraction.on('select', (e: SelectEvent) => {
      this.vectorSource.removeFeature(e.selected[0]);
    });
    this.map.addInteraction(this.selectInteraction);
  }

  // See if the vector layer has some features.
  public get hasTasks(): boolean {
    return !!this.vectorSource && this.vectorSource.getFeatures().length !== 0;
  }

  public onSaveButtonClicked() {
    const polygons: Polygon[] = this.vectorSource.getFeatures().map(f => {
      f = f.clone(); // otherwise we would change the polygons on the map
      let polygon = (f.getGeometry() as Polygon);

      // Even though we transformed the coordinates after their creation from EPSG:4326 into EPSG:3857, the OSM- and overall Geo-World works
      // with lat/lon values, so we transform it back.
      polygon = polygon.transform('EPSG:3857', 'EPSG:4326') as Polygon;

      // The openlayers "Polygon" Class can contain multiple rings. Because the
      // user just draws things, there only exist polygons having only one ring.
      // Therefore we take the first and only ring as our task geometry.
      return polygon;
    });

    this.createProject(this.newProjectName, this.newMaxProcessPoints, this.projectDescription, polygons);
  }

  public createProject(name: string, maxProcessPoints: number, projectDescription: string, polygons: Polygon[]) {
    const geometries = polygons.map(p => p.getCoordinates()[0]) as [number, number][][];
    const owner = this.userService.getUser();
    this.projectService.createNewProject(name, maxProcessPoints, projectDescription, geometries, [owner], owner)
      .subscribe(project => {
        this.router.navigate(['/manager']);
      }, e => {
        this.errorService.addError('Could not create project');
      });
  }

  // This function expects the geometry to be in the EPSG:4326 projection.
  public onShapesCreated(features: Feature[]) {
    // Transform geometries into the correct projection
    features.forEach(f => {
      f.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    });

    this.vectorSource.refresh(); // clears the source
    features.forEach(f => this.vectorSource.addFeature(f));
  }

  // This function expects the geometry to be in the EPSG:4326 projection.
  public onShapesUploaded(features: Feature[]) {
    this.vectorSource.clear();

    this.onShapesCreated(features);
  }

  onTabSelected(tabIndex: number) {
    switch (tabIndex) {
      case 0: // Tab: Draw
        this.drawInteraction.setActive(true);
        this.modifyInteraction.setActive(true);
        this.selectInteraction.setActive(false);
        break;
      case 1: // Tab: Upload
        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(true);
        this.selectInteraction.setActive(false);
        break;
      case 2:
        this.drawInteraction.setActive(false);
        this.modifyInteraction.setActive(false);
        this.selectInteraction.setActive(true);
        break;
      default:
        throw new Error('Unknown tab index ' + tabIndex);
    }
  }
}
