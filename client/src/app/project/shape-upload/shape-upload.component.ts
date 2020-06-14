import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NotificationService } from '../../common/notification.service';
import { Feature } from 'ol';
import { GeoJSON, GPX } from 'ol/format';
import GeometryType from 'ol/geom/GeometryType';
import { Geometry, GeometryCollection, LinearRing, LineString, MultiLineString, MultiPolygon, Polygon } from 'ol/geom';
import OSMXML from 'ol/format/OSMXML';
import FeatureFormat from 'ol/format/Feature';

@Component({
  selector: 'app-shape-upload',
  templateUrl: './shape-upload.component.html',
  styleUrls: ['./shape-upload.component.scss']
})
export class ShapeUploadComponent implements OnInit {
  @Output() public featuresUploaded = new EventEmitter<Feature[]>();

  constructor(
    private notificationService: NotificationService
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
      this.notificationService.addError('Could not upload file \'${evt.target.files[0]}\'');
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
    (format.readFeatures(content) as Feature[]).forEach(f => features.push(...this.toUsableTaskFeature(f)));
    return features;
  }

  // Takes the given geometry and tries to build polygon-like feature from it (Polygon or MultiPolygon). Sometimes a geometry is e.g. a
  // line string that's closed, so this will convert it into a Polygon. Unclosed strings are not converted.
  private expandToPolygonLike(geometry: Geometry): Geometry[] {
    switch (geometry.getType()) {
      case GeometryType.POLYGON:
        return [geometry as Polygon];

      case GeometryType.MULTI_POLYGON:
        return [geometry as MultiPolygon];

      case GeometryType.GEOMETRY_COLLECTION:
        const geomCollection = geometry as GeometryCollection;
        const result: Geometry[] = [];
        geomCollection.getGeometries()
          .map(g => this.expandToPolygonLike(g))
          .forEach(l => l.forEach(l2 => result.push(l2)));
        return result;

      case GeometryType.MULTI_LINE_STRING:
        const lineStrings = (geometry as MultiLineString).getLineStrings();
        const closedLines = lineStrings.filter(l => this.hasPolygonCoordinates(l));
        return closedLines.map(l => new Polygon([l.getCoordinates()]));

      case GeometryType.LINE_STRING:
        const line = geometry as LineString;

        // if the line string is closed, then we create a polygon from it
        if (this.hasPolygonCoordinates(line)) {
          return [new Polygon([line.getCoordinates()])];
        } else {
          return [];
        }

      case GeometryType.LINEAR_RING:
        const ring = (geometry as LinearRing);
        return [new Polygon([ring.getCoordinates()])];

      default:
        return [];
    }
  }

  private hasPolygonCoordinates(line: LineString): boolean {
    const lastCoord = line.getCoordinates()[line.getCoordinates().length - 1];
    const firstCoord = line.getCoordinates()[0];
    // We need three distinct coordinate plus one fourth coordinate, which has to be equal to the first one in order to close the line.
    return line.getCoordinates().length >= 4 &&
      firstCoord[0] === lastCoord[0] &&
      firstCoord[1] === lastCoord[1];
  }

  // Some editors (like JOSM) dont create a "Polygon" feature for a closed ring but a "LineString" feature. This, however, is not usable for
  // tasks where we need Polygons or MultiPolygons.
  private toUsableTaskFeature(feature: Feature): Feature[] {
    const expandedGeometries = this.expandToPolygonLike(feature.getGeometry());

    return expandedGeometries.map(f => new Feature(f));
  }
}
