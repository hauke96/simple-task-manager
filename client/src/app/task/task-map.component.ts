import { AfterViewInit, Component, Input } from '@angular/core';
import { TaskService } from './task.service';
import { UserService } from '../user/user.service';
import { Task } from './task.material';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Attribution, defaults as defaultControls, ScaleLine } from 'ol/control';
import { Polygon } from 'ol/geom';
import { Fill, Stroke, Style, Text } from 'ol/style';

// import { Draw } from 'ol/interaction';

@Component({
  selector: 'app-task-map',
  templateUrl: './task-map.component.html',
  styleUrls: ['./task-map.component.scss']
})
export class TaskMapComponent implements AfterViewInit {
  @Input() tasks: Task[];

  private map: Map;
  private task: Task;
  private vectorSource: VectorSource;

  constructor(
    private taskService: TaskService,
    private userService: UserService
  ) {
  }

  ngAfterViewInit(): void {
    // this style function will choose between default colors and colors for
    // selected features
    const style = (feature, resolution) => {
      const task = this.tasks.find(t => t.id === feature.get('task_id'));

      // Convert process point count to color (0 points = red; max points = green)
      let r = Math.round(Math.min(255, 512 * (1 - (task.processPoints / task.maxProcessPoints)))).toString(16);
      let g = Math.round(Math.min(255, 512 * (task.processPoints / task.maxProcessPoints))).toString(16);
      if (r.length === 1) {
        r = '0' + r;
      }
      if (g.length === 1) {
        g = '0' + g;
      }
      let fillColor = '#' + r + g + '00';

      // Border color and fill transparency
      let borderColor = '#009688b0';
      let borderWidth = 2;
      if (this.taskService.getSelectedTask().id === feature.get('task_id')) {
        borderColor = '#009688';
        borderWidth = 4;
        fillColor += '50';

        // Move feature to top so that the border is good visible
        const tmp = feature.clone();
        this.vectorSource.removeFeature(feature);
        this.vectorSource.addFeature(tmp);
      } else {
        fillColor += '30';
      }

      // Text (porcess percentage)
      const labelWeight = this.userService.getUser() === task.assignedUser ? 'bold 10pt' : 'normal 8pt';
      let labelText: string;
      if (task.processPoints === task.maxProcessPoints) {
        labelText = 'DONE';
      } else {
        labelText = Math.floor(100 * task.processPoints / task.maxProcessPoints) + '%';
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
          font: labelWeight + ' Dejavu Sans, sans-serif',
          text: labelText
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

    // react to changed selection and update the map style
    this.taskService.selectedTaskChanged.subscribe((task) => {
      this.task = task;
      this.vectorSource.changed();
    });
  }

  private showTaskPolygon(task: Task) {
    let geometry = new Polygon([task.geometry]);

    // transform from lat/long into WSG84 to show on map
    geometry = geometry.clone().transform('EPSG:4326', 'EPSG:3857');

    // create the map feature and set the task-id to select the task when the
    // polygon has been clicked
    const feature = new Feature(geometry);
    feature.set('task_id', task.id);

    this.vectorSource.addFeature(feature);
  }
}
