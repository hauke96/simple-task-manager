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
  private $onLayerRemoved: Subject<BaseLayer> = new Subject();
  private $onFitView: Subject<Extent> = new Subject();
  private $onMoveToOutsideGeometry: Subject<Extent> = new Subject();

  get onLayerAdded(): Observable<BaseLayer> {
    return this.$onLayerAdded.asObservable();
  }

  get onLayerRemoved(): Observable<BaseLayer> {
    return this.$onLayerRemoved.asObservable();
  }

  get onFitView(): Observable<Extent> {
    return this.$onFitView.asObservable();
  }

  get onMoveToOutsideGeometry(): Observable<Coordinate> {
    return this.$onMoveToOutsideGeometry.asObservable();
  }

  public addLayer(layer: BaseLayer): void {
    this.$onLayerAdded.next(layer);
  }

  public removeLayer(layer: BaseLayer): void {
    this.$onLayerRemoved.next(layer);
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
}
