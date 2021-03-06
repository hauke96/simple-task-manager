import { Injectable } from '@angular/core';
import { Geometry, GeometryCollection, LinearRing, LineString, MultiLineString, MultiPolygon, Polygon } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import { Feature } from 'ol';
import FeatureFormat from 'ol/format/Feature';
import { EsriJSON, GeoJSON, GPX, KML, WKT } from 'ol/format';
import OSMXML from 'ol/format/OSMXML';

@Injectable({
  providedIn: 'root'
})
export class GeometryService {

  constructor() {
  }

  public parseData(data: string | ArrayBuffer): Feature[] {
    let format: FeatureFormat = new GeoJSON();
    let features: Feature[] = this.dataToFeatures(format, data);

    const formats = [
      new GeoJSON(),
      new OSMXML(),
      new GPX(),
      new EsriJSON(),
      new KML(),
      new WKT()
    ];

    let nextFormat: FeatureFormat;

    for (let i = 0; i < formats.length; i++) {
      nextFormat = formats[i];

      // If i>0 then the first try wasn't successful
      if (i > 0) {
        console.log(`${format.constructor.name} parsing failed, try ${nextFormat.constructor.name} format`);
      }

      format = nextFormat;

      features = this.dataToFeatures(format, data);
      if (features.length > 0) {
        break;
      }
    }

    return features;
  }

  private dataToFeatures(format: FeatureFormat, data: string | ArrayBuffer): Feature[] {
    try {
      const features = format.readFeatures(data) as Feature[];

      if (!features || features.length === 0) {
        return [];
      }

      return ([] as Feature[]).concat(...features.map(f => this.toUsableTaskFeature(f)));
    } catch {
      return [];
    }
  }

  // Some editors (like JOSM) dont create a "Polygon" feature for a closed ring but a "LineString" feature. This, however, is not usable for
  // tasks where we need Polygons or MultiPolygons.
  public toUsableTaskFeature(feature: Feature): Feature[] {
    if (!feature) {
      return [];
    }

    const geometry = feature.getGeometry();
    if (!geometry) {
      return [];
    }

    const expandedGeometries = this.expandToPolygonLike(geometry);

    return expandedGeometries.map((geom: Geometry) => {
      const props = feature.getProperties();
      props.geometry = geom;
      return new Feature(props);
    });
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
}
