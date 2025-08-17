import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Feature, Map, MapBrowserEvent, View } from 'ol';
import { Attribution, ScaleLine } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { OSM } from 'ol/source';
import { MapLayerService } from '../../services/map-layer.service';
import BaseLayer from 'ol/layer/Base';
import { Unsubscriber } from '../../unsubscriber';
import { extend, Extent, intersects } from 'ol/extent';
import RenderFeature from 'ol/render/Feature';
import { Coordinate } from 'ol/coordinate';
import { Interaction } from 'ol/interaction';
import { Geometry } from 'ol/geom';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    standalone: false
})
export class MapComponent extends Unsubscriber implements OnInit {
  @Output()
  public mapClicked: EventEmitter<(Feature<any> | RenderFeature)[]> = new EventEmitter();
  @Output()
  public moveEnd: EventEmitter<Coordinate | undefined> = new EventEmitter();

  map: Map;

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

    this.map.on('click', (event: MapBrowserEvent<UIEvent>) => this.mapClicked.next(this.map.getFeaturesAtPixel(event.pixel)));
    this.map.on('moveend', () => this.moveEnd.next(this.map.getView().getCenter()));

    this.unsubscribeLater(this.layerService.onLayerAdded.subscribe((layer: BaseLayer) => this.addLayer(layer)));
    this.unsubscribeLater(this.layerService.onLayerRemoved.subscribe((layer: BaseLayer) => this.removeLayer(layer)));
    this.unsubscribeLater(this.layerService.onInteractionAdded.subscribe((interaction: Interaction) => this.addInteraction(interaction)));
    this.unsubscribeLater(this.layerService.onInteractionRemoved.subscribe(
      (interaction: Interaction) => this.removeInteraction(interaction)));
    this.unsubscribeLater(this.layerService.onFitView.subscribe((extent: Extent) => this.fitMapView(extent)));
    this.unsubscribeLater(this.layerService.onFitToFeatures.subscribe((features: Feature<Geometry>[]) => this.fitToFeatures(features)));
    this.unsubscribeLater(this.layerService.onCenterView.subscribe((coordinate: Coordinate) => this.centerMapView(coordinate)));
    this.unsubscribeLater(this.layerService.onMoveToOutsideGeometry.subscribe((extent: Extent) => this.moveToOutsideGeometry(extent)));
  }

  onZoomIn(): void {
    const zoom = this.map?.getView()?.getZoom();
    if (!zoom) {
      return;
    }

    this.map?.getView().animate({zoom: zoom + 0.5, duration: 250});
  }

  onZoomOut(): void {
    const zoom = this.map?.getView()?.getZoom();
    if (!zoom) {
      return;
    }

    this.map?.getView().animate({zoom: zoom - 0.5, duration: 250});
  }

  private addLayer(layer: BaseLayer): void {
    this.map.addLayer(layer);
  }

  private removeLayer(layer: BaseLayer): BaseLayer | undefined {
    return this.map.removeLayer(layer);
  }

  private addInteraction(interaction: Interaction): void {
    this.map.addInteraction(interaction);
  }

  private removeInteraction(interaction: Interaction): Interaction | undefined {
    return this.map.removeInteraction(interaction);
  }

  private fitMapView(extent: number[]): void {
    this.map.getView().fit(
      extent, {
        size: this.map.getSize(),
        padding: [25, 25, 25, 25] // in pixels
      });
  }

  private centerMapView(coordinate: Coordinate): void {
    this.map.getView().setCenter(coordinate);
  }

  private moveToOutsideGeometry(extent: number[]): void {
    const geometryVisible = intersects(this.map.getView().calculateExtent(), extent);
    if (!geometryVisible) {
      const center = [extent[0] + (extent[2] - extent[0]) / 2, extent[1] + (extent[3] - extent[1]) / 2];
      this.map.getView().setCenter(center);
    }
  }

  private fitToFeatures(features: Feature<Geometry>[]): void {
    const geometries = features.filter(f => !!f.getGeometry()).map(f => f.getGeometry() as Geometry);

    if (geometries.length === 0) {
      return;
    }

    // Subtract the padding from the map size. This padding will be added back to the map size below.
    let overallExtent = geometries[0].getExtent();

    // Try to extend the extent over all new features: If one feature is outside the current extent, then the map view should be adjusted
    geometries.forEach(g => overallExtent = extend(overallExtent, g.getExtent()));

    this.fitMapView(overallExtent);
  }
}
