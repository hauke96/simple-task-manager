import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ErrorService } from '../../common/error.service';
import { Feature } from 'ol';
import { GPX } from 'ol/format';
import GeometryType from 'ol/geom/GeometryType';
import { LineString, MultiLineString, Polygon } from 'ol/geom';

@Component({
  selector: 'app-shape-upload',
  templateUrl: './shape-upload.component.html',
  styleUrls: ['./shape-upload.component.scss']
})
export class ShapeUploadComponent implements OnInit {
  @Output() public featuresUploaded = new EventEmitter<Feature[]>();

  constructor(
    private errorService: ErrorService
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
        this.errorService.addError(e);
      }
    };
    reader.onerror = (evt) => {
      console.error(evt);
      this.errorService.addError('Could not upload file \'${evt.target.files[0]}\'');
    };
  }

  public fileToFeatures(fileName: any, content: string | ArrayBuffer): Feature[] {
    let features: Feature[];

    if (fileName.endsWith('.gpx')) {
      features = this.gpxToFeatures(content);
    } else {
      throw new Error(`Unknown file type of file ${fileName}`);
    }

    return features;
  }

  public gpxToFeatures(result: string | ArrayBuffer): Feature[] {
    const features: Feature[] = [];
    const fmt = new GPX();

    const rawFeatures = fmt.readFeatures(result);

    // Turn (multi) line strings into separate polygons
    rawFeatures.forEach(rawFeature => {
      let lineStrings: LineString[];

      // A GPX file can contain both, line string and multi line strings
      const geometryType = rawFeature.getGeometry().getType();
      if (geometryType === GeometryType.MULTI_LINE_STRING) {
        const multiLineString = (rawFeature.getGeometry() as MultiLineString);
        lineStrings = multiLineString.getLineStrings();
      } else if (geometryType === GeometryType.LINE_STRING) {
        lineStrings = [(rawFeature.getGeometry() as LineString)];
      } else if (geometryType === GeometryType.POINT) {
        return;
      } else {
        throw new Error(`Invalid geometry type ${geometryType} in GPX file`);
      }

      const polygons = lineStrings.map(s => new Polygon([s.getCoordinates()]));
      const actualFeatures = polygons.map(p => new Feature(p));
      actualFeatures.forEach(f => features.push(f));
    });

    return features;
  }
}
