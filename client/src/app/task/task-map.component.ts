import { Component, AfterViewInit } from '@angular/core';
import { Map, View } from 'ol';
import { Tile } from 'ol/layer';
import { OSM } from 'ol/source';
import { defaults as defaultControls, Attribution, ScaleLine } from 'ol/control';


@Component({
  selector: 'app-task-map',
  templateUrl: './task-map.component.html',
  styleUrls: ['./task-map.component.scss']
})
export class TaskMapComponent implements AfterViewInit {

  private map: Map;

  constructor() { }

  ngAfterViewInit(): void {
  this.map = new Map({
      target: 'map',
      controls: defaultControls().extend([
        new ScaleLine(),
        new Attribution()
      ]),
      layers: [
        new Tile({
          source: new OSM()
        })
      ],
      view: new View({
        center: [0, 0],
        zoom: 3,
        minZoom: 3,
        maxZoom: 19
      })
    });
  }
}
