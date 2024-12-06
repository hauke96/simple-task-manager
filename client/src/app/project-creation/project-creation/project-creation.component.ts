import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../project/project.service';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Geometry, Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import { NotificationService } from '../../common/services/notification.service';
import { CurrentUserService } from '../../user/current-user.service';
import Snap from 'ol/interaction/Snap';
import Modify from 'ol/interaction/Modify';
import Select, { SelectEvent } from 'ol/interaction/Select';
import { Observable, of, Subject, tap } from 'rxjs';
import Interaction from 'ol/interaction/Interaction';
import { ProjectProperties } from '../project-properties';
import { DrawEvent } from 'ol/interaction/Draw';
import { TaskDraftService } from '../task-draft.service';
import { TaskDraft } from '../../task/task.material';
import { FeatureLike } from 'ol/Feature';
import { ConfigProvider } from '../../config/config.provider';
import { ProjectImportService } from '../project-import.service';
import { Project } from '../../project/project.material';
import { Unsubscriber } from '../../common/unsubscriber';
import { Coordinate } from 'ol/coordinate';
import { MapLayerService } from '../../common/services/map-layer.service';
import { TranslateService } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import CircleStyle from 'ol/style/Circle';
import { JosmDataSource } from '../../common/entities/josm-data-source';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss'],
  // Provide services here to automatically reset the services when the project has been created.
  providers: [TaskDraftService, ProjectImportService]
})
export class ProjectCreationComponent extends Unsubscriber implements OnInit, OnDestroy, AfterViewInit {
  private static readonly baseColor = '#009688';
  private static readonly baseLightColor = '#80cbc4';
  private static readonly baseTransparentColor = ProjectCreationComponent.baseColor + '90';

  public projectProperties: ProjectProperties = new ProjectProperties('', 100, '', 'OSM');
  public existingProjects: Observable<Project[]>;
  public loadingProjects: boolean;
  public resetToolbarSelectionSubject: Subject<void> = new Subject<void>();

  private modifyInteraction: Modify;
  private drawInteraction: Draw;
  private removeInteraction: Select;
  private selectInteraction: Select;

  private vectorSource: VectorSource<Feature<Geometry>>;
  private vectorLayer: VectorLayer<Feature<Geometry>>;
  private previewVectorSource: VectorSource<Feature<Geometry>>;
  private previewVectorLayer: VectorLayer<Feature<Geometry>>;

  constructor(
    private projectService: ProjectService,
    private taskDraftService: TaskDraftService,
    private notificationService: NotificationService,
    private currentUserService: CurrentUserService,
    private projectImportService: ProjectImportService,
    private mapLayerService: MapLayerService,
    private router: Router,
    public config: ConfigProvider,
    private translationService: TranslateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.unsubscribeLater(
      this.taskDraftService.tasksAdded.subscribe((tasks: TaskDraft[]) => {
        this.addTasks(tasks);
      }),
      this.taskDraftService.taskRemoved.subscribe((id: string) => {
        this.removeTask(id);
      }),
      this.taskDraftService.taskSelected.subscribe(() => {
        this.previewVectorSource.clear();
        this.vectorLayer.changed();
      }),
      this.taskDraftService.taskChanged.subscribe((task: TaskDraft) => {
        this.removeTask(task.id);
        this.addTasks([task]);
      }),
      this.projectImportService.projectPropertiesImported.subscribe((properties: ProjectProperties) => {
        this.projectProperties = properties;
      })
    );

    this.loadingProjects = true;
    this.existingProjects = this.projectService.getProjects().pipe(
      tap(() => this.loadingProjects = false),
      catchError(e => {
        this.loadingProjects = false;
        console.error(e);
        this.notificationService.addError(this.translationService.instant('project.could-not-load-projects'));
        return of([]);
      })
    );
  }

  ngAfterViewInit(): void {
    // this vector source contains all the task geometries
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: f => this.getStyle(f)
    });

    // this vector source contains all the task geometries for a preview
    this.previewVectorSource = new VectorSource();
    this.previewVectorLayer = new VectorLayer({
      source: this.previewVectorSource,
      style: this.getPreviewStyle()
    });

    this.mapLayerService.addLayer(this.vectorLayer);
    this.mapLayerService.addLayer(this.previewVectorLayer);

    // Restore map center
    const center = this.getLastLocation();
    if (!!center) {
      this.mapLayerService.centerView(center);
    }

    this.addMapInteractions();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();

    this.mapLayerService.removeLayer(this.vectorLayer);
    this.mapLayerService.removeLayer(this.previewVectorLayer);
  }

  onMoveEnd(mapCenter: Coordinate | undefined): void {
    if (mapCenter) {
      this.storeLastLocation(mapCenter);
    }
  }

  private getLastLocation(): Coordinate | undefined {
    let lastLocation: Coordinate | undefined;
    const jsonValue = localStorage.getItem('project_creation_map_center');

    if (jsonValue) {
      lastLocation = JSON.parse(jsonValue);
    }

    return lastLocation;
  }

  private storeLastLocation(coordinate: Coordinate): void {
    localStorage.setItem('project_creation_map_center', JSON.stringify(coordinate));
  }

  private getStyle(feature: FeatureLike): Style {
    const borderColor = ProjectCreationComponent.baseTransparentColor;
    let fillColor = ProjectCreationComponent.baseLightColor;

    // Less opaque, when selected
    if (!!this.selectedTask && feature.get('id') === this.selectedTask.id) {
      fillColor += '80';
    } else {
      fillColor += '40';
    }

    return new Style({
      stroke: new Stroke({
        color: borderColor,
        width: 2,
      }),
      fill: new Fill({
        color: fillColor
      })
    });
  }

  private getPreviewStyle(): Style {
    return new Style({
      stroke: new Stroke({
        color: ProjectCreationComponent.baseColor,
        width: 2,
      })
    });
  }

  private getInteractionHandleStyle(): Style {
    return new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: ProjectCreationComponent.baseTransparentColor
        }),
        stroke: new Stroke({
          width: 1,
          color: '#fff'
        })
      })
    });
  }

  public get rootTabTitles(): string[] {
    return [
      '' + this.translationService.instant('project-creation.tab-titles.properties'),
      '' + this.translationService.instant('project-creation.tab-titles.tasks'),
      '' + this.translationService.instant('project-creation.tab-titles.import')
    ];
  }

  public get canAddTasks(): boolean {
    return this.taskDraftService.getTasks().length < this.config.maxTasksPerProject;
  }

  public get taskDrafts(): TaskDraft[] {
    return this.taskDraftService.getTasks();
  }

  public get selectedTask(): TaskDraft | undefined {
    return this.taskDraftService.getSelectedTask();
  }

  /**
   * Called after a task has been added to the task draft service.
   */
  private addTasks(tasks: TaskDraft[]): void {
    const newFeatures = tasks.map(t => this.toFeature(t));
    this.vectorSource.addFeatures(newFeatures);

    this.mapLayerService.fitToFeatures(this.vectorSource.getFeatures());

    if (!this.canAddTasks) {
      this.setInteraction(this.drawInteraction, false);
    }
  }

  private removeTask(id: string | undefined): void {
    const featureToRemove = this.vectorSource.getFeatures().find(f => f.get('id') === id);
    if (!id || !featureToRemove) {
      return;
    }

    this.vectorSource.removeFeature(featureToRemove);
  }

  private addMapInteractions(): void {
    // DRAW
    this.drawInteraction = new Draw({
      type: 'Polygon',
      style: f => [
        // Style for the geometries:
        this.getStyle(f),
        // Style for the handle of the cursor:
        this.getInteractionHandleStyle()
      ]
    });
    this.drawInteraction.setActive(false);
    this.drawInteraction.on('drawend', (e: DrawEvent) => {
      // Add shaped but do not transform them (first *false*) and do not move map view (second *false)
      this.taskDraftService.addTasks([this.taskDraftService.toTaskDraft(e.feature)], false);
    });
    this.mapLayerService.addInteraction(this.drawInteraction);

    // MODIFY
    const snap = new Snap({
      source: this.vectorSource,
    });
    this.mapLayerService.addInteraction(snap);

    this.modifyInteraction = new Modify({
      source: this.vectorSource,
      style: this.getInteractionHandleStyle()
    });
    this.modifyInteraction.setActive(false);
    this.mapLayerService.addInteraction(this.modifyInteraction);

    // DELETE
    this.removeInteraction = new Select();
    this.removeInteraction.on('select', (e: SelectEvent) => {
      if (!!e.selected[0]) {
        const id = e.selected[0].get('id') as string;
        this.taskDraftService.removeTask(id);
      }
    });
    this.removeInteraction.setActive(false);
    this.mapLayerService.addInteraction(this.removeInteraction);

    // SELECT
    this.selectInteraction = new Select({
      layers: [this.vectorLayer],
      style: null
    });
    this.selectInteraction.on('select', (e: SelectEvent) => {
      if (!!e.selected[0]) {
        this.taskDraftService.selectTask('' + e.selected[0].get('id'));
      } else {
        this.taskDraftService.deselectTask();
      }
    });
    this.mapLayerService.addInteraction(this.selectInteraction);
  }

  // See if the vector layer has some features.
  public get hasTasks(): boolean {
    return this.taskDraftService.hasTasks();
  }

  // TODO pass TaskDrafts here to "createProject"
  public onSaveButtonClicked(): void {
    const features: Feature<Geometry>[] = this.vectorSource.getFeatures().map(f => {
      f = f.clone(); // otherwise we would change the polygons on the map
      let polygon = (f.getGeometry() as Polygon);

      // Even though we transformed the coordinates after their creation from EPSG:4326 into EPSG:3857, the OSM- and overall Geo-World works
      // with lat/lon values, so we transform it back.
      polygon = polygon.transform('EPSG:3857', 'EPSG:4326');
      f.setGeometry(polygon);

      return f;
    });

    this.createProject(
      this.projectProperties.projectName,
      this.projectProperties.maxProcessPoints,
      this.projectProperties.projectDescription,
      this.projectProperties.josmDataSource,
      features
    );
  }

  public createProject(name: string,
                       maxProcessPoints: number,
                       projectDescription: string,
                       josmDataSource: JosmDataSource,
                       features: Feature<Geometry>[]): void {
    const owner = this.currentUserService.getUserId();
    if (!owner) {
      // TODO Show error notification
      return;
    }

    this.projectService.createNewProject(name, maxProcessPoints, projectDescription, features, [owner], owner, josmDataSource)
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (e: HttpErrorResponse) => {
          console.error(e);
          this.notificationService.addError(this.translationService.instant('project-creation.could-not-create-project') + ': ' + e.error);
        }
      });
  }

  onTabSelected(): void {
    // Disable all interactions and also notify the toolbar that all interactions are disabled (-> toolbar will remove any selection)
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
    this.removeInteraction.setActive(false);
    this.selectInteraction.setActive(true);

    this.previewVectorSource.clear();

    this.resetToolbarSelectionSubject.next();
  }

  onToggleDraw(): void {
    this.setInteraction(this.drawInteraction, !this.drawInteraction.getActive());
  }

  onToggleEdit(): void {
    this.setInteraction(this.modifyInteraction, !this.modifyInteraction.getActive());
  }

  onToggleDelete(): void {
    this.setInteraction(this.removeInteraction, !this.removeInteraction.getActive());
  }

  setInteraction(interaction: Interaction, active: boolean): void {
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

    this.taskDraftService.deselectTask();
  }

  onDividePreviewClicked(taskDrafts: TaskDraft[]): void {
    this.previewVectorSource.clear();
    this.previewVectorSource.addFeatures(taskDrafts.map(t => this.toFeature(t)));
  }

  public toFeature(task: TaskDraft): Feature<Geometry> {
    const f = new Feature(task.geometry);
    f.set('id', task.id);
    f.set('name', task.name);
    return f;
  }
}
