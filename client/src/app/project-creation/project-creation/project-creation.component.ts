import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../project/project.service';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Attribution, defaults as defaultControls, ScaleLine } from 'ol/control';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import { NotificationService } from '../../common/notification.service';
import GeometryType from 'ol/geom/GeometryType';
import { CurrentUserService } from '../../user/current-user.service';
import Snap from 'ol/interaction/Snap';
import Modify from 'ol/interaction/Modify';
import Select, { SelectEvent } from 'ol/interaction/Select';
import { Subject } from 'rxjs';
import Interaction from 'ol/interaction/Interaction';
import { ProjectProperties } from '../project-properties';
import { DrawEvent } from 'ol/interaction/Draw';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss']
})
export class ProjectCreationComponent implements AfterViewInit {
  public projectProperties: ProjectProperties = new ProjectProperties('', 100, '');

  // Polygon division values
  public selectedPolygon: Feature;

  // public for tests
  public modifyInteraction: Modify;
  public drawInteraction: Draw;
  public removeInteraction: Select;
  public selectInteraction: Select;
  public vectorSource: VectorSource;

  // For the toolbar
  public resetToolbarSelectionSubject: Subject<void> = new Subject<void>();

  private map: Map;

  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private currentUserService: CurrentUserService,
    private router: Router
  ) {
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

  public get rootTabTitles(): string[] {
    return [
      $localize`:@@TABS_PROPERTIES:Properties`,
      $localize`:@@TABS_TASKS:Tasks`,
      $localize`:@@TABS_UPLOAD:Upload`,
      $localize`:@@TABS_REMOTE:Remote`
    ];
  }

  public get taskFeatures(): Feature[] {
    return this.vectorSource.getFeatures();
  }

  private addMapInteractions() {
    // DRAW
    this.drawInteraction = new Draw({
      type: GeometryType.POLYGON
    });
    this.drawInteraction.setActive(false);
    this.drawInteraction.on('drawend', (e: DrawEvent) => {
      // Add shaped but do not transform them (first *false*) and do not move map view (second *false)
      this.onShapesCreated([e.feature], false, false);
    });
    this.map.addInteraction(this.drawInteraction);

    // MODIFY
    const snap = new Snap({
      source: this.vectorSource
    });
    this.map.addInteraction(snap);

    this.modifyInteraction = new Modify({
      source: this.vectorSource
    });
    this.modifyInteraction.setActive(false);
    this.map.addInteraction(this.modifyInteraction);

    // DELETE
    this.removeInteraction = new Select();
    this.removeInteraction.on('select', (e: SelectEvent) => {
      this.vectorSource.removeFeature(e.selected[0]);
    });
    this.removeInteraction.setActive(false);
    this.map.addInteraction(this.removeInteraction);

    // SELECT
    this.selectInteraction = new Select();
    this.selectInteraction.on('select', (e: SelectEvent) => {
      this.selectedPolygon = e.selected[0];
    });
    this.map.addInteraction(this.selectInteraction);
  }

  // See if the vector layer has some features.
  public get hasTasks(): boolean {
    return !!this.vectorSource && this.vectorSource.getFeatures().length !== 0;
  }

  public onSaveButtonClicked() {
    const features: Feature[] = this.vectorSource.getFeatures().map(f => {
      f = f.clone(); // otherwise we would change the polygons on the map
      let polygon = (f.getGeometry() as Polygon);

      // Even though we transformed the coordinates after their creation from EPSG:4326 into EPSG:3857, the OSM- and overall Geo-World works
      // with lat/lon values, so we transform it back.
      polygon = polygon.transform('EPSG:3857', 'EPSG:4326') as Polygon;
      f.setGeometry(polygon);

      return f;
    });

    this.createProject(
      this.projectProperties.projectName,
      this.projectProperties.maxProcessPoints,
      this.projectProperties.projectDescription,
      features
    );
  }

  public createProject(name: string, maxProcessPoints: number, projectDescription: string, features: Feature[]) {
    const owner = this.currentUserService.getUserId();
    this.projectService.createNewProject(name, maxProcessPoints, projectDescription, features, [owner], owner)
      .subscribe(project => {
        this.router.navigate(['/manager']);
      }, e => {
        console.error(e);
        this.notificationService.addError($localize`:@@ERROR_NOT_CREATE_PROJ:Could not create project`);
      });
  }

  /**
   * This function takes the features and puts them on the map. Use the *transformGeometry* parameter to control whether the geometry
   * projection should be adjusted or not.
   *
   * All features without any valid ID (check *hasIntegerId()*) will get a new valid ID. If the name is not set, the name property will also
   * be filled (with the ID of that feature).
   *
   * After this pre-processing, each feature is added to the map and - if fitViewToFeatures is *true* - the view will be changes so that all
   * features are visible.
   *
   * @param features The new feature that should be added to the map
   * @param transformGeometry Default: true. Set to false if all feature are already in 'EPSG:3857' (no transformation needed) and to true
   * if the features are in 'EPSG:4326' projection.
   * @param fitViewToFeatures Default: true. Moves the map view so that all features are visible.
   */
  public onShapesCreated(features: Feature[], transformGeometry = true, fitViewToFeatures = true) {
    console.log(features.map(f => f.getProperties()));
    // Transform geometries into the correct projection
    features.forEach(f => {
      if (transformGeometry) {
        f.getGeometry().transform('EPSG:4326', 'EPSG:3857');
      }

      // The ID should be a string in general, so the else-clause turns a number into a string.
      const id = f.get('id');
      if (!this.hasIntegerId(f)) {
        f.set('id', this.findSmallestId(features.concat(this.vectorSource.getFeatures())));
      } else {
        f.set('id', id + '');
      }

      const name = f.get('name');
      if (!name || name.trim() === '') {
        f.set('name', f.get('id'));
      }
    });

    features.forEach(f => this.vectorSource.addFeature(f));

    if (fitViewToFeatures) {
      this.map.getView().fit(this.vectorSource.getExtent(), {
        size: this.map.getSize(),
        padding: [25, 25, 25, 25] // in pixels
      });
    }
  }

  /**
   * Goes through all features and finds the smallest non-negative number that's not currently an ID of one of these features.
   *
   * ### Example:
   *
   * The IDs of the given features are: 4, 1, 2, 0
   *
   * The output of this function would be: 3
   */
  findSmallestId(features: Feature[]): string {
    let currentId = 0;

    this.sortFeaturesById(features).forEach(f => {
      if (+f.get('id') === currentId) {
        currentId++;
      }
    });

    return currentId + '';
  }

  /**
   * This does two things: Filter the features by an valid integer ID (see *hasIntegerId()*) and sorts the remaining features by their ID.
   */
  sortFeaturesById(features: Feature[]): Feature[] {
    return features
      .filter(f => {
        return this.hasIntegerId(f);
      })
      .sort((f1: Feature, f2: Feature) => {
        return f1.get('id') - f2.get('id');
      });
  }

  /**
   * Returns true when the ID of the feature is a non-negative integer.
   *
   * Examples when this function will return *true*: 0, 1, '1'
   *
   * Examples when this function will return *false*: -1, '-1, undefined, null, 'one', ''
   */
  private hasIntegerId(f: Feature): boolean {
    const id: number = parseFloat(f.get('id'));
    return Number.isInteger(id) && id >= 0;
  }

  onSelectedShapeSubdivided(features: Feature[]) {
    this.vectorSource.removeFeature(this.selectedPolygon);
    // Do not move the map view because the subdivided polygon is already in the visible area of the map (because the user selected the polygon manually).
    this.onShapesCreated(features, true, false);
  }

  onTabSelected() {
    // Disable all interactions and also notify the toolbar that all interactions are disabled (-> toolbar will remove any selection)
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
    this.removeInteraction.setActive(false);
    this.selectInteraction.setActive(true);

    this.resetToolbarSelectionSubject.next();
  }

  onZoomIn() {
    this.map.getView().setZoom(this.map.getView().getZoom() + 1);
  }

  onZoomOut() {
    this.map.getView().setZoom(this.map.getView().getZoom() - 1);
  }

  onToggleDraw() {
    this.setInteraction(this.drawInteraction, !this.drawInteraction.getActive());
  }

  onToggleEdit() {
    this.setInteraction(this.modifyInteraction, !this.modifyInteraction.getActive());
  }

  onToggleDelete() {
    this.setInteraction(this.removeInteraction, !this.removeInteraction.getActive());
  }

  setInteraction(interaction: Interaction, active: boolean) {
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
    this.removeInteraction.setActive(false);

    interaction.setActive(active);

    // When no button active -> Activate select interaction
    this.selectInteraction.getFeatures().clear();
    this.selectInteraction.setActive(
      !this.drawInteraction.getActive() &&
      !this.modifyInteraction.getActive() &&
      !this.removeInteraction.getActive()
    );

    this.selectedPolygon = undefined;
  }
}
