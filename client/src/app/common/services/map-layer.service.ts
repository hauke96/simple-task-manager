import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';

@Injectable({
  providedIn: 'root'
})
export class MapLayerService {

  private $onLayerAdded: Subject<BaseLayer> = new Subject<BaseLayer>();
  private $onFitView: Subject<Extent> = new Subject<Extent>();
  private $onMapClicked: Subject<Coordinate> = new Subject<Coordinate>();

  get onLayerAdded(): Observable<BaseLayer> {
    return this.$onLayerAdded.asObservable();
  }

  get onFitView(): Observable<Extent> {
    return this.$onFitView.asObservable();
  }

  get onMapClicked(): Observable<Coordinate> {
    return this.$onMapClicked.asObservable();
  }

  public addLayer(layer: BaseLayer): void {
    this.$onLayerAdded.next(layer);
  }

  public fitView(extent: Extent): void {
    this.$onFitView.next(extent);
  }

  public mapClicked(coordinate: Coordinate): void {
    this.$onMapClicked.next(coordinate);
  }
}
