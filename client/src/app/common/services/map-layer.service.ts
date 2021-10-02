import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';
import { Interaction } from 'ol/interaction';

@Injectable({
  providedIn: 'root'
})
export class MapLayerService {

  private $onLayerAdded: Subject<BaseLayer> = new Subject();
  private $onLayerRemoved: Subject<BaseLayer> = new Subject();
  private $onInteractionAdded: Subject<Interaction> = new Subject();
  private $onInteractionRemoved: Subject<Interaction> = new Subject();
  private $onFitView: Subject<Extent> = new Subject();
  private $onCenterView: Subject<Coordinate> = new Subject();
  private $onMoveToOutsideGeometry: Subject<Extent> = new Subject();

  get onLayerAdded(): Observable<BaseLayer> {
    return this.$onLayerAdded.asObservable();
  }

  get onLayerRemoved(): Observable<BaseLayer> {
    return this.$onLayerRemoved.asObservable();
  }

  get onInteractionAdded(): Observable<Interaction> {
    return this.$onInteractionAdded.asObservable();
  }

  get onInteractionRemoved(): Observable<Interaction> {
    return this.$onInteractionRemoved.asObservable();
  }

  get onFitView(): Observable<Extent> {
    return this.$onFitView.asObservable();
  }

  get onCenterView(): Observable<Coordinate> {
    return this.$onCenterView.asObservable();
  }

  get onMoveToOutsideGeometry(): Observable<Extent> {
    return this.$onMoveToOutsideGeometry.asObservable();
  }

  public addLayer(layer: BaseLayer): void {
    this.$onLayerAdded.next(layer);
  }

  public removeLayer(layer: BaseLayer): void {
    this.$onLayerRemoved.next(layer);
  }

  public addInteraction(interaction: Interaction): void {
    this.$onInteractionAdded.next(interaction);
  }

  public removeInteraction(interaction: Interaction): void {
    this.$onInteractionRemoved.next(interaction);
  }

  public fitView(extent: Extent): void {
    this.$onFitView.next(extent);
  }

  public centerView(newCenter: Coordinate): void {
    this.$onCenterView.next(newCenter);
  }

  /**
   * Moves to an geometry if it's outside of the map. If the given extent of the geometry intersects with the map, the map is not moved as
   * the geometry is not considered to be "outside" of the visible map.
   */
  public moveToOutsideGeometry(extent: Extent): void {
    this.$onMoveToOutsideGeometry.next(extent);
  }
}
