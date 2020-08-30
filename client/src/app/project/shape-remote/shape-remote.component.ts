import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feature } from 'ol';
import OSMXML from 'ol/format/OSMXML';
import { NotificationService } from '../../common/notification.service';
import { GeometryService } from '../../common/geometry.service';
import { LoadingService } from '../../common/loading.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-shape-remote',
  templateUrl: './shape-remote.component.html',
  styleUrls: ['./shape-remote.component.scss']
})
export class ShapeRemoteComponent implements OnInit {
  @Output() public featuresLoaded = new EventEmitter<Feature[]>();

  public queryUrl: string;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private geometryService: GeometryService,
    private loadingService: LoadingService
  ) {
  }

  ngOnInit(): void {
  }

  onLoadButtonClicked() {
    this.loadingService.loading = true;

    this.http.get(this.queryUrl, {responseType: 'text', headers: {ContentType: 'text/xml'}})
      .pipe(
        tap(() => this.loadingService.loading = false)
      ).subscribe(
      data => {
        try {
          let features = (new OSMXML().readFeatures(data) as Feature[]);
          features = [].concat(...features.map(f => this.geometryService.toUsableTaskFeature(f)));

          if (!features || features.length !== 0) {
            this.featuresLoaded.emit(features);
          } else {
            this.notificationService.addError($localize`:@@ERROR_OVERPASS_NO_POLYGONS:No usable polygons have been found. Make sure the output format is set to 'out:xml' and the result contains actual polygons.`);
          }
        } catch (e) {
          console.error('Error parsing loaded OSM-XML');
          console.log(data);
          console.error(e);
          this.notificationService.addError($localize`:@@ERROR_PARSING_OSM_DATA:Error parsing loaded OSM data`);
        }
      }, e => {
        console.error('Error loading OSM-XML from remote URL');
        console.error(e);
        this.notificationService.addError($localize`:@@ERROR_UNABLE_LOAD_URL:Unable to load data from remote URL`);
      });
  }
}
