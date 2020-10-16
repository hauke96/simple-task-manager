import { AfterViewInit, Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss']
})
export class ProjectCreationComponent implements OnInit, AfterViewInit {
  public projectProperties: ProjectProperties;

  // Polygon division values
  public selectedPolygon: Feature;

  // public for tests
  public modifyInteraction: Modify;
  public drawInteraction: Draw;
  public removeInteraction: Select;
  public selectInteraction: Select;
  public vectorSource: VectorSource;

  private map: Map;

  // For the toolbar
  public resetToolbarSelectionSubject: Subject<void> = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private notificationService: NotificationService,
    private currentUserService: CurrentUserService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Choose some default values
    this.projectProperties = {
      projectName: '',
      maxProcessPoints: 100,
      projectDescription: ''
    };
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

  // TODO create TaskDraft class
  public get taskFeatures(): Feature[] {
    return this.vectorSource.getFeatures();
  }

  private addMapInteractions() {
    // DRAW
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: GeometryType.POLYGON
    });
    this.drawInteraction.setActive(false);
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
    this.selectInteraction.setActive(false);
    this.map.addInteraction(this.selectInteraction);
  }

  // See if the vector layer has some features.
  public get hasTasks(): boolean {
    return !!this.vectorSource && this.vectorSource.getFeatures().length !== 0;
  }

  public onSaveButtonClicked() {
    let taskNameCounter = 1;

    const features: Feature[] = this.vectorSource.getFeatures().map(f => {
      f = f.clone(); // otherwise we would change the polygons on the map
      let polygon = (f.getGeometry() as Polygon);

      // Even though we transformed the coordinates after their creation from EPSG:4326 into EPSG:3857, the OSM- and overall Geo-World works
      // with lat/lon values, so we transform it back.
      polygon = polygon.transform('EPSG:3857', 'EPSG:4326') as Polygon;
      f.setGeometry(polygon);

      // Set a name as increasing number, if no name exists
      const name = f.get('name');
      if (!name || name.trim() === '') {
        f.set('name', taskNameCounter);
        taskNameCounter++;
      }

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

  // This function expects the geometry to be in the EPSG:4326 projection.
  public onShapesCreated(features: Feature[]) {
    console.log(features.map(f => f.getProperties()));
    // Transform geometries into the correct projection
    features.forEach(f => {
      f.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    });

    features.forEach(f => this.vectorSource.addFeature(f));

    this.map.getView().fit(this.vectorSource.getExtent(), {
      size: this.map.getSize(),
      padding: [25, 25, 25, 25] // in pixels
    });
  }

  onSelectedShapeSubdivided(features: Feature[]) {
    this.vectorSource.removeFeature(this.selectedPolygon);
    this.onShapesCreated(features);
  }

  onTabSelected() {
    // Disable all interactions and also notify the toolbar that all interactions are disabled (-> toolbar will remove any selection)
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
    this.removeInteraction.setActive(false);
    this.selectInteraction.setActive(false);

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

  onShapeSelectionRequested() {
    this.resetToolbarSelectionSubject.next();
    this.setInteraction(this.selectInteraction, !this.selectInteraction.getActive());
  }

  setInteraction(interaction: Interaction, active: boolean) {
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
    this.removeInteraction.setActive(false);

    this.selectInteraction.getFeatures().clear();
    this.selectInteraction.setActive(false);

    interaction.setActive(active);

    this.selectedPolygon = undefined;
  }
}
