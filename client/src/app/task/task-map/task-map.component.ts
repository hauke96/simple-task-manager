import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { TaskService } from '../task.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Task } from '../task.material';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { ProcessPointColorService } from '../../common/services/process-point-color.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { MapLayerService } from '../../common/services/map-layer.service';
import RenderFeature from 'ol/render/Feature';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-task-map',
  templateUrl: './task-map.component.html',
  styleUrls: ['./task-map.component.scss']
})
export class TaskMapComponent extends Unsubscriber implements AfterViewInit, OnDestroy {
  @Input() tasks: Task[];

  selectedTask: Task | undefined;

  private vectorSource: VectorSource<Feature<Geometry>>;
  private vectorLayer: VectorLayer<Feature<Geometry>>;

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private processPointColorService: ProcessPointColorService,
    private layerService: MapLayerService,
    private translationService: TranslateService
  ) {
    super();
  }

  ngAfterViewInit(): void {
    // this vector source contains all the task geometries
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: (f, r) => this.getStyle(f)
    });

    this.tasks.forEach(t => {
      this.showTaskPolygon(t);
    });

    this.layerService.fitView(this.vectorSource.getExtent());

    this.unsubscribeLater(
      // react to changed selection and update the map style
      this.taskService.selectedTaskChanged.subscribe((task) => {
        this.selectTask(task);
      })
    );
    this.selectTask(this.taskService.getSelectedTask());

    this.layerService.addLayer(this.vectorLayer);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();

    this.layerService.removeLayer(this.vectorLayer);
  }

  // Clicking on the map selects the clicked polygon (and therefore the according task)
  onMapClicked(clickedFeatures: (Feature<any> | RenderFeature)[]): void {
    // When a feature was found on the map, it'll be selected in the task
    // service. This will trigger the "selectedTaskChanged" event and causes
    // the source-refresh below in the handler. This will then update the map
    // style and highlights the correct geometry on the map.

    const featureTaskIds = clickedFeatures.map(f => f.get('task_id'));
    const clickedTasks = this.tasks.filter(task => featureTaskIds.includes(task.id));
    if (clickedTasks.length > 0) {
      this.taskService.selectTask(clickedTasks[0]);
    }
  }

  private selectTask(task: Task | undefined): void {
    this.selectedTask = task;
    this.vectorSource.changed();

    if (!!this.selectedTask) {
      // Center view when the task isn't visible on the map
      const feature = this.getTaskFeature();
      if (!feature) {
        throw new Error('Task feature undefined');
      }

      const geometry = feature.getGeometry();
      if (!geometry) {
        console.error(feature);
        throw new Error('Task feature geometry undefined');
      }

      this.layerService.moveToOutsideGeometry(geometry.getExtent());
    }
  }

  private getTaskFeature(): Feature<Geometry> | undefined {
    return this.vectorSource.getFeatures().find(f => f.get('task_id') === this.selectedTask?.id);
  }

  public getStyle(feature: FeatureLike): Style {
    const task = this.tasks.find(t => t.id === feature.get('task_id'));
    if (!task) {
      throw new Error(`Task with task_id ${feature.get('task_id')} not found`);
    }

    const hasAssignedUser = !!task.assignedUser && task.assignedUser.uid !== '';
    const currentUserTask = task.assignedUser && this.currentUserService.getUserId() === task.assignedUser.uid;
    const isSelected = this.selectedTask && this.selectedTask.id === feature.get('task_id');
    const borderColor = '#009688';

    // Convert process point count to color (0 points = red; max points = green)
    let fillColor = this.processPointColorService.getProcessPointsColor(task.processPoints, task.maxProcessPoints);

    // Less opaque, when selected
    if (hasAssignedUser) {
      fillColor += '90';
    } else {
      fillColor += '50';
    }

    // Thick border when there's an assigned user
    let borderWidth = 1;
    if (isSelected) {
      borderWidth = 4;
    }

    // Text (progress percentage). Bold text on own tasks.
    const labelWeight = currentUserTask ? 'bold' : 'normal';
    let labelText: string;
    if (task.isDone) {
      labelText = this.translationService.instant('task-map.task-done');
    } else {
      labelText = Math.floor(100 * task.processPoints / task.maxProcessPoints) + '%';
    }

    // Add user name
    if (currentUserTask) {
      labelText += '\n(' + this.translationService.instant('task-map.you') + ')';
    } else if (hasAssignedUser) {
      // @ts-ignore "hasAssignedUser" ensures that we have an assignedUser
      labelText += '\n(' + task.assignedUser.name + ')';
    }

    return new Style({
      stroke: new Stroke({
        color: borderColor,
        width: borderWidth,
      }),
      fill: new Fill({
        color: fillColor
      }),
      text: new Text({
        font: labelWeight + ' 10pt Dejavu Sans, sans-serif',
        text: labelText
      })
    });
  }

  private showTaskPolygon(task: Task): void {
    // Without clone(), the tasks geometry would be changes inline.
    const feature = task.geometry.clone();
    feature.getGeometry()?.transform('EPSG:4326', 'EPSG:3857');
    feature.set('task_id', task.id);

    this.vectorSource.addFeature(feature);
  }
}
