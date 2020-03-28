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
    const style = new Style({
      stroke: new Stroke({
        color: '#26a69a',
        width: 2,
      }),
      fill: new Fill({
        color: '#80cbc450'
      })
    });
    
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

//    const draw = new Draw({
//      source: this.vectorSource,
//      type: 'Polygon'
//    });
//    this.map.addInteraction(draw);
    this.map.on('click', (evt) => {
      this.map.forEachFeatureAtPixel(evt.pixel, (feature) => this.taskService.selectTask(feature.get('task_id')));
    });

    this.taskService.getTasks(this.taskIds).forEach(t => this.showTaskPolygon(t));

//    this.task = this.taskService.getSelectedTask();
//    this.taskService.selectedTaskChanged.subscribe((task) => {
//      this.showTaskPolygon(task);
//    });
  }

  private showTaskPolygon(task: Task) {
    let geometry = new Polygon([task.geometry]);
    geometry = geometry.clone().transform('EPSG:4326', 'EPSG:3857');
    let feature = new Feature(geometry);
    feature.set('task_id', task.id);
    this.vectorSource.addFeature(feature);
  }
}
