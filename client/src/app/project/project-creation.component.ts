import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from './project.service';
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
import { Draw } from 'ol/interaction';

@Component({
  selector: 'app-project-creation',
  templateUrl: './project-creation.component.html',
  styleUrls: ['./project-creation.component.scss']
})
export class ProjectCreationComponent implements OnInit, AfterViewInit {
  public newProjectName: string;

  private map: Map;
  private vectorSource: VectorSource;

  constructor(private projectService: ProjectService, private router: Router) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Simple style function the the polygons
    const style = (feature, resolution) => {
      let borderColor = '#26a69a90';
      let fillColor = '#80cbc430';

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

    const draw = new Draw({
      source: this.vectorSource,
      type: 'Polygon'
    });
    this.map.addInteraction(draw);
   }

  public onSaveButtonClicked() {
    const coordinates: [[number, number]][] = [];
    this.vectorSource.getFeatures().map(f => {
      let polygon = (f.getGeometry() as Polygon);
      polygon = polygon.transform('EPSG:3857', 'EPSG:4326');
      // The openlayers "Polygon" Class can contain multiple rings. Because the
      // user just draws things, there only exist polygons having only one ring.
      // Therefore we take the first and only ring as our task geometry.
      coordinates.push(polygon.getCoordinates()[0]);
    });

    this.projectService.createNewProject(this.newProjectName, coordinates);
    this.router.navigate(['/manager']);
  }
}
