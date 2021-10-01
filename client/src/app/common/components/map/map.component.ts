import { Component, OnInit } from '@angular/core';
import { Map, MapBrowserEvent, View } from 'ol';
import { Attribution, ScaleLine } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { MapLayerService } from '../../services/map-layer.service';
import BaseLayer from 'ol/layer/Base';
import { Unsubscriber } from '../../unsubscriber';
import { Extent } from 'ol/extent';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent extends Unsubscriber implements OnInit {

  private map: Map;

  constructor(private layerService: MapLayerService) {
    super();
  }

  ngOnInit(): void {
    this.map = new Map({
      target: 'map',
      controls: [
        new ScaleLine(),
        new Attribution()
      ],
      layers: [
        new TileLayer({
          source: new OSM()
        }),
      ],
      view: new View({
        center: [1110161, 7085688],
        projection: 'EPSG:3857',
        zoom: 14,
        minZoom: 0,
        maxZoom: 19
      })
    });

    this.map.on('click', (event: MapBrowserEvent<UIEvent>) => this.layerService.mapClicked(this.map.getCoordinateFromPixel(event.pixel)));

    this.unsubscribeLater(this.layerService.onLayerAdded.subscribe((layer: BaseLayer) => this.map.addLayer(layer)));
    this.unsubscribeLater(this.layerService.onFitView.subscribe((extent: Extent) =>
      this.map.getView().fit(
        extent, {
          size: this.map.getSize(),
          padding: [25, 25, 25, 25] // in pixels
        })
    ));
  }

  onZoomIn() {
    const zoom = this.map.getView().getZoom();
    if (!zoom) {
      return;
    }

    this.map.getView().setZoom(zoom + 1);
  }

  onZoomOut() {
    const zoom = this.map.getView().getZoom();
    if (!zoom) {
      return;
    }

    this.map.getView().setZoom(zoom - 1);
  }
}
