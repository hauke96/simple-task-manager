import { AfterViewInit, Component, Input } from '@angular/core';
import { TaskService } from '../task.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Task } from '../task.material';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Attribution, defaults as defaultControls, ScaleLine } from 'ol/control';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { ProcessPointColorService } from '../../common/process-point-color.service';
import { Unsubscriber } from '../../common/unsubscriber';

@Component({
  selector: 'app-task-map',
  templateUrl: './task-map.component.html',
  styleUrls: ['./task-map.component.scss']
})
export class TaskMapComponent extends Unsubscriber implements AfterViewInit {
  @Input() tasks: Task[];

  private map: Map;
  task: Task;
  private vectorSource: VectorSource;

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
    private processPointColorService: ProcessPointColorService
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

    this.tasks.forEach(t => {
      this.showTaskPolygon(t);
      this.map.getView().fit(this.vectorSource.getExtent(), {
        size: this.map.getSize(),
        padding: [25, 25, 25, 25] // in pixels
      });
    });

    // Clicking on the map selects the clicked polygon (and therefore the according task)
    this.map.on('click', (evt) => {
      // When a feature was found on the map, it'll be selected in the task
      // service. This will trigger the "selectedTaskChanged" event and causes
      // the source-refresh below in the handler. This will then update the map
      // style and highlights the correct geometry on the map.
      this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const clickedTask = this.tasks.find(t => t.id === feature.get('task_id'));
        this.taskService.selectTask(clickedTask);
      });
    });

    this.unsubscribeLater(
      // react to changed selection and update the map style
      this.taskService.selectedTaskChanged.subscribe((task) => {
        this.task = task;
        this.vectorSource.changed();
      })
    );
  }

  public getStyle(feature) {
    const task = this.tasks.find(t => t.id === feature.get('task_id'));

    const hasAssignedUser = !!task.assignedUser && task.assignedUser.uid !== '';
    const currentUserTask = task.assignedUser && this.currentUserService.getUserId() === task.assignedUser.uid;
    const isSelected = this.task && this.task.id === feature.get('task_id');
    const borderColor = '#009688';

    // Convert process point count to color (0 points = red; max points = green)
    let fillColor = this.processPointColorService.getProcessPointsColor(task.processPoints, task.maxProcessPoints);

    // Less opaque, when selected
    if (isSelected) {
      fillColor += '80';
    } else {
      fillColor += '40';
    }

    // Thick border when there's an assigned user
    let borderWidth = 1;
    if (hasAssignedUser) {
      borderWidth = 4;
    }

    // Text (progress percentage). Bold text on own tasks.
    const labelWeight = currentUserTask ? 'bold' : 'normal';
    let labelText: string;
    if (task.processPoints === task.maxProcessPoints) {
      labelText = 'DONE';
    } else {
      labelText = Math.floor(100 * task.processPoints / task.maxProcessPoints) + '%';
    }

    // Add user name
    if (currentUserTask) {
      labelText += '\n(you)';
    } else if (hasAssignedUser) {
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
    feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    feature.set('task_id', task.id);

    this.vectorSource.addFeature(feature);
  }
}
