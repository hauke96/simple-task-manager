import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ErrorService } from '../../common/error.service';
import { Feature } from 'ol';
import { GeoJSON, GPX } from 'ol/format';
import GeometryType from 'ol/geom/GeometryType';
import { Geometry, GeometryCollection, LinearRing, LineString, MultiLineString, Polygon } from 'ol/geom';
import OSMXML from 'ol/format/OSMXML';
import XMLFeature from 'ol/format/XMLFeature';
import FeatureFormat from 'ol/format/Feature';

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

  public dataToFeatures(content: string | ArrayBuffer, format: FeatureFormat): Feature[]{
    return this.expandFeatures(format.readFeatures(content) as Feature[]);
  }

  // This takes all kind of geometries and builds polygons out of them. Each multi-geometry (e.g. MultiLineString) is separated and each
  // sub-geometry in there will results a separate polygon.
  private expandFeatures(rawFeatures: Feature[]): Feature[] {
    const features: Feature[] = [];

    rawFeatures.forEach(rawFeature => {
      let lineStrings: LineString[];

      // A GPX file can contain both, line string and multi line strings
      lineStrings = this.featureToLineStrings(rawFeature.getGeometry());

      if (!lineStrings || lineStrings.length === 0) {
        return;
      }

      // Only line strings with at least 3 points can create a polygon
      lineStrings = lineStrings.filter(s => s.getCoordinates().length >= 3);

      const polygons = lineStrings.map(s => new Polygon([s.getCoordinates()]));
      const actualFeatures = polygons.map(p => new Feature(p));
      actualFeatures.forEach(f => features.push(f));
    });

    return features;
  }

  private featureToLineStrings(geometry: Geometry): LineString[] {
    console.log(geometry.getType());
    switch (geometry.getType()) {
      case GeometryType.POLYGON:
        const polygon = (geometry as Polygon);
        return polygon.getLinearRings().map(r => new LineString(r.getCoordinates()));

      case GeometryType.MULTI_POLYGON:
        // TODO Decide how to deal with that? Maybe some day we'll use GeoJson as default format than, this wouldn't be a problem
        return [];

      case GeometryType.GEOMETRY_COLLECTION:
        const geomCollection = geometry as GeometryCollection;
        const result: LineString[] = [];
        geomCollection.getGeometries()
          .map(g => this.featureToLineStrings(g))
          .forEach(l => l.forEach(l2 => result.push(l2)));
        return result;

      case GeometryType.MULTI_LINE_STRING:
        const multiLineString = (geometry as MultiLineString);
        return multiLineString.getLineStrings();

      case GeometryType.LINE_STRING:
        return [(geometry as LineString)];

      case GeometryType.LINEAR_RING:
        const ring = (geometry as LinearRing);
        return [new LineString(ring.getCoordinates())];

      default:
        return [];
    }
  }
}
