import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NotificationService } from '../../common/notification.service';
import { Feature } from 'ol';
import { GeoJSON, GPX } from 'ol/format';
import OSMXML from 'ol/format/OSMXML';
import FeatureFormat from 'ol/format/Feature';
import { GeometryService } from '../../common/geometry.service';

@Component({
  selector: 'app-shape-upload',
  templateUrl: './shape-upload.component.html',
  styleUrls: ['./shape-upload.component.scss']
})
export class ShapeUploadComponent implements OnInit {
  @Output() public featuresUploaded = new EventEmitter<Feature[]>();

  constructor(
    private notificationService: NotificationService,
    private geometryService: GeometryService
  ) {
  }

  ngOnInit(): void {
  }

  public onFileSelected(event: any) {
    const reader = new FileReader();
    const file = event.target.files[0];

    reader.readAsText(file, 'UTF-8');

    reader.onload = (evt) => {
      try {
        const features = this.fileToFeatures(file.name, evt.target.result);
        this.featuresUploaded.emit(features);
      } catch (e) {
        this.notificationService.addError(e);
      }
    };
    reader.onerror = (evt) => {
      console.error(evt);
      this.notificationService.addError($localize`:@@ERROR_COULD_NOT_UPLOAD:Could not upload file '${ (<any>evt.target).files[0] }:INTERPOLATION:'`);
    };
  }

  public fileToFeatures(fileName: any, content: string | ArrayBuffer): Feature[] {
    let features: Feature[];

    if (fileName.toLowerCase().endsWith('.gpx')) {
      features = this.dataToFeatures(content, new GPX());
    } else if (fileName.toLowerCase().endsWith('.geojson')) {
      features = this.dataToFeatures(content, new GeoJSON());
    } else if (fileName.toLowerCase().endsWith('.osm')) {
      features = this.dataToFeatures(content, new OSMXML());
    } else {
      throw new Error(`Unknown file type of file ${fileName}`);
    }

    return features;
  }

  public dataToFeatures(content: string | ArrayBuffer, format: FeatureFormat): Feature[] {
    const features: Feature[] = [];
    (format.readFeatures(content) as Feature[]).forEach(f => features.push(...this.geometryService.toUsableTaskFeature(f)));
    return features;
  }
}
