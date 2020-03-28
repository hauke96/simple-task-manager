import { Component, AfterViewInit, Input } from '@angular/core';
import { TaskService } from './task.service';
import { Task } from './task.material';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { defaults as defaultControls, ScaleLine, Attribution } from 'ol/control';
import { Polygon } from 'ol/geom';
import { Projection } from 'ol/proj';
import { Style, Stroke, Fill } from 'ol/style';
import { Feature } from 'ol';
//import { Draw } from 'ol/interaction';

@Component({
  selector: 'app-task-map',
  templateUrl: './task-map.component.html',
  styleUrls: ['./task-map.component.scss']
})
export class TaskMapComponent implements AfterViewInit {
  @Input() taskIds: string[];

  private map: Map;
  private task: Task;
  private vectorSource: VectorSource;

  constructor(private taskService: TaskService) { }

  ngAfterViewInit(): void {
    // this style function will choose between default colors and colors for
    // selected features
    const style = (feature, resolution) => {
      let borderColor = '#26a69a90';
      let fillColor = '#80cbc430';

      const selectedTaskId = this.taskService.getSelectedTask().id;
      if (selectedTaskId == feature.get('task_id')) {
        borderColor = '#26a69a';
        fillColor = '#80cbc450';
      }

      return new Style({
        stroke: new Stroke({
          color: borderColor,
          width: 2,
        }),
        fill: new Fill({
          color: fillColor
        })
      })
    };
    
    // this vector source contains all the task geometries
    this.vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: style
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

// Test code for drawing polygons:
//    const draw = new Draw({
//      source: this.vectorSource,
//      type: 'Polygon'
//    });
//    this.map.addInteraction(draw);

    this.taskService.getTasks(this.taskIds).forEach(t => this.showTaskPolygon(t));

    // Clicking on the map selects the clicked polygon (and therefore the according task)
    this.map.on('click', (evt) => {
      // When a feature was found on the map, it'll be selected in the task
      // service. This will trigger the "selectedTaskChanged" event and causes
      // the source-refresh below in the handler. This will then update the map
      // style and highlights the correct geometry on the map.
      this.map.forEachFeatureAtPixel(evt.pixel, (feature) => this.taskService.selectTask(feature.get('task_id')));
    });

    // react to changed selection and update the map style
    this.taskService.selectedTaskChanged.subscribe((task) => {
      this.vectorSource.changed();
    });
  }

  private showTaskPolygon(task: Task) {
    let geometry = new Polygon([task.geometry]);

    // transform from lat/long into WSG84 to show on map
    geometry = geometry.clone().transform('EPSG:4326', 'EPSG:3857');

    // create the map feature and set the task-id to select the task when the
    // polygon has been clicked
    let feature = new Feature(geometry);
    feature.set('task_id', task.id);

    this.vectorSource.addFeature(feature);
  }
}
