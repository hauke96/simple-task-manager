import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feature } from 'ol';
import OSMXML from 'ol/format/OSMXML';
import { NotificationService } from '../../common/notification.service';
import { GeometryService } from '../../common/geometry.service';

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
    private geometryService: GeometryService
  ) {
  }

  ngOnInit(): void {
  }

  onLoadButtonClicked() {
    this.http.get(this.queryUrl, {responseType: 'text', headers: {ContentType: 'text/xml'}}).subscribe(
      data => {
        try {
          let features = (new OSMXML().readFeatures(data) as Feature[]);
          features = [].concat(...features.map(f => this.geometryService.toUsableTaskFeature(f)));
          this.featuresLoaded.emit(features);
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
