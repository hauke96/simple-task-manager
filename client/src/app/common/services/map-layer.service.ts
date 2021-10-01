import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { Feature, MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Geometry } from 'ol/geom';
import RenderFeature from 'ol/render/Feature';

@Injectable({
  providedIn: 'root'
})
export class MapLayerService {

  private $onLayerAdded: Subject<BaseLayer> = new Subject<BaseLayer>();
  private $onFitView: Subject<Extent> = new Subject<Extent>();
  private $onMapClicked: Subject<(Feature<any> | RenderFeature)[]> = new Subject();

  get onLayerAdded(): Observable<BaseLayer> {
    return this.$onLayerAdded.asObservable();
  }

  get onFitView(): Observable<Extent> {
    return this.$onFitView.asObservable();
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

  public mapClicked(clickedFeatures: (Feature<any> | RenderFeature)[]): void {
    this.$onMapClicked.next(clickedFeatures);
  }
}
