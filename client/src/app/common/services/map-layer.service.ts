import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import RenderFeature from 'ol/render/Feature';

@Injectable({
  providedIn: 'root'
})
export class MapLayerService {

  private $onLayerAdded: Subject<BaseLayer> = new Subject();
  private $onFitView: Subject<Extent> = new Subject();
  private $onMoveToOutsideGeometry: Subject<Extent> = new Subject();
  private $onMapClicked: Subject<(Feature<any> | RenderFeature)[]> = new Subject();

  get onLayerAdded(): Observable<BaseLayer> {
    return this.$onLayerAdded.asObservable();
  }

  get onFitView(): Observable<Extent> {
    return this.$onFitView.asObservable();
  }

  get onMoveToOutsideGeometry(): Observable<Coordinate> {
    return this.$onMoveToOutsideGeometry.asObservable();
  }

  get onMapClicked(): Observable<(Feature<any> | RenderFeature)[]> {
    return this.$onMapClicked.asObservable();
  }

  public addLayer(layer: BaseLayer): void {
    this.$onLayerAdded.next(layer);
  }

  public fitView(extent: Extent): void {
    this.$onFitView.next(extent);
  }

  /**
   * Moves to an geometry if it's outside of the map. If the given extent of the geometry intersects with the map, the map is not moved as
   * the geometry is not considered to be "outside" of the visible map.
   */
  public moveToOutsideGeometry(extent: Extent): void {
    this.$onMoveToOutsideGeometry.next(extent);
  }

  public mapClicked(clickedFeatures: (Feature<any> | RenderFeature)[]): void {
    this.$onMapClicked.next(clickedFeatures);
  }
}
