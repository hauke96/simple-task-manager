import { AfterViewInit, Component, Input } from '@angular/core';
import { TaskService } from '../task.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Task } from '../task.material';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { ProcessPointColorService } from '../../common/services/process-point-color.service';
import { Unsubscriber } from '../../common/unsubscriber';
import { Coordinate } from 'ol/coordinate';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { MapLayerService } from '../../common/services/map-layer.service';
import RenderFeature from 'ol/render/Feature';

@Component({
  selector: 'app-task-map',
  templateUrl: './task-map.component.html',
  styleUrls: ['./task-map.component.scss']
})
export class TaskMapComponent extends Unsubscriber implements AfterViewInit {
  @Input() tasks: Task[];

  task: Task;
  private vectorSource: VectorSource<Geometry>;

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private processPointColorService: ProcessPointColorService,
    private layerService: MapLayerService
  ) {
    super();
  }

  ngAfterViewInit(): void {
    // this vector source contains all the task geometries
    this.vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: (f, r) => this.getStyle(f)
    });

    this.tasks.forEach(t => {
      this.showTaskPolygon(t);
      this.layerService.fitView(this.vectorSource.getExtent());
    });

    // Clicking on the map selects the clicked polygon (and therefore the according task)
    this.layerService.onMapClicked.subscribe((features: (Feature<any> | RenderFeature)[]) => {
      // When a feature was found on the map, it'll be selected in the task
      // service. This will trigger the "selectedTaskChanged" event and causes
      // the source-refresh below in the handler. This will then update the map
      // style and highlights the correct geometry on the map.

      const featureTaskIds = features.map(f => f.get('task_id'));
      const clickedTasks = this.tasks.filter(task => featureTaskIds.includes(task.id));
      if (clickedTasks.length > 0) {
        this.taskService.selectTask(clickedTasks[0]);
      }
    });

    this.unsubscribeLater(
      // react to changed selection and update the map style
      this.taskService.selectedTaskChanged.subscribe((task) => {
        this.selectTask(task);
      })
    );
    this.selectTask(this.taskService.getSelectedTask());

    this.layerService.addLayer(vectorLayer);
  }

  private selectTask(task: Task): void {
    this.task = task;
    this.vectorSource.changed();

    if (!!this.task) {
      // Center view when the task isn't visible on the map
      const feature = this.getTaskFeature();
      if (!feature || !feature.getGeometry()) {
        console.error(feature);
        throw new Error('Task feature or feature geometry undefined');
      }

      // TODO
      // const taskGeometryVisible = intersects(this.map.getView().calculateExtent(), feature.getGeometry().getExtent());
      // if (!taskGeometryVisible) {
      //   this.map.getView().setCenter(this.getTaskCenter());
      // }
    }
  }

  private getTaskCenter(): Coordinate {
    const taskFeature = this.getTaskFeature();
    if (!taskFeature || !taskFeature.getGeometry()) {
      console.error(taskFeature);
      throw new Error('Task feature or feature geometry undefined');
    }

    // @ts-ignore
    const e = taskFeature.getGeometry().getExtent();
    const center = [e[0] + (e[2] - e[0]) / 2, e[1] + (e[3] - e[1]) / 2];
    return center;
  }

  private getTaskFeature(): Feature<Geometry> | undefined {
    return this.vectorSource.getFeatures().find(f => f.get('task_id') === this.task.id);
  }

  public getStyle(feature: FeatureLike): Style {
    const task = this.tasks.find(t => t.id === feature.get('task_id'));
    if (!task) {
      throw new Error(`Task with task_id ${feature.get('task_id')} not found`);
    }

    const hasAssignedUser = !!task.assignedUser && task.assignedUser.uid !== '';
    const currentUserTask = task.assignedUser && this.currentUserService.getUserId() === task.assignedUser.uid;
    const isSelected = this.task && this.task.id === feature.get('task_id');
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
      labelText = $localize`:@@TASK_MAP_DONE:DONE`;
    } else {
      labelText = Math.floor(100 * task.processPoints / task.maxProcessPoints) + '%';
    }

    // Add user name
    if (currentUserTask) {
      labelText += '\n(' + $localize`:@@TASK_YOU:you` + ')';
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

  private showTaskPolygon(task: Task) {
    // Without clone(), the tasks geometry would be changes inline.
    const feature = task.geometry.clone();
    feature.getGeometry()?.transform('EPSG:4326', 'EPSG:3857');
    feature.set('task_id', task.id);

    this.vectorSource.addFeature(feature);
  }
}
