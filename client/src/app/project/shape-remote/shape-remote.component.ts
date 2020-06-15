import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feature } from 'ol';
import OSMXML from 'ol/format/OSMXML';
import { NotificationService } from '../../common/notification.service';

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
    private notificationService: NotificationService
  ) {
  }

  ngOnInit(): void {
  }

  onLoadButtonClicked() {
    this.http.get(this.queryUrl, {responseType: 'text', headers: {ContentType: 'text/xml'}}).subscribe(
      data => {
        try {
          const features = (new OSMXML().readFeatures(data) as Feature[]);
          console.log(features);
          this.featuresLoaded.emit(features);
        } catch (e) {
          console.log(data);
          console.error('Error parsing loaded OSM-XML');
          this.notificationService.addError('Error parsing loaded OSM data');
        }
      }, e => {
        console.error('Error loading OSM-XML from remote URL');
        console.error(e);
        this.notificationService.addError('Unable to load data from remote URL');
      });
  }
}
