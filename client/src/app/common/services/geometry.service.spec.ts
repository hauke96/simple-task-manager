import { TestBed } from '@angular/core/testing';

import { GeometryService } from './geometry.service';
import { GeometryCollection, LineString, Polygon } from 'ol/geom';
import { Feature } from 'ol';

/**
 * This service is also tested via the tests of the shape-creation components (mainly the "shape-upload" component), so we son't have any
 * huge test data here.
 */
describe('GeometryService', () => {
  let service: GeometryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeometryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should preserve simple geometries', () => {
    // Create two overlapping geometries
    const f1 = new Polygon([[[0, 0], [10, 0], [5, 5]]]);
    const f2 = new Polygon([[[5, 0], [15, 0], [10, 5]]]);

    const features = service.toUsableTaskFeature(new Feature(new GeometryCollection([f1, f2])));

    expect(features.length).toEqual(2);
    expect((features[0].getGeometry() as Polygon).getCoordinates()).toEqual(f1.getCoordinates());
    expect((features[1].getGeometry() as Polygon).getCoordinates()).toEqual(f2.getCoordinates());
  });

  it('should preserve feature properties', () => {
    const f = new Feature(new Polygon([[[0, 0], [10, 0], [5, 5]]]));
    f.set('name', 'foobar');
    f.set('__123', '456__');

    const newFeature = service.toUsableTaskFeature(f);

    expect(newFeature.length).toEqual(1);
    expect(newFeature[0].get('name')).toEqual('foobar');
    expect(newFeature[0].get('__123')).toEqual('456__');
  });

  it('should not fail on empty geometry', () => {
    // @ts-ignore
    let f = service.toUsableTaskFeature(null);
    expect(f).toEqual([]);

    // @ts-ignore
    f = service.toUsableTaskFeature(undefined);
    expect(f).toEqual([]);

    // @ts-ignore
    f = service.toUsableTaskFeature(0);
    expect(f).toEqual([]);

    // @ts-ignore
    f = service.toUsableTaskFeature('');
    expect(f).toEqual([]);

    f = service.toUsableTaskFeature(new Feature());
    expect(f).toEqual([]);
  });

  it('should ignore unclosed line string', () => {
    const f = new Feature(new LineString([[0, 0], [2, 5], [6, -4], [10, 0], [5, 5]]));

    const newFeature = service.toUsableTaskFeature(f);

    expect(newFeature).toEqual([]);
  });

  it('should read GPX file', () => {
    const features = service.parseData(exampleGpxFile);

    // two "trk" and one "rte"
    expect(features.length).toEqual(3);
  });

  it('should read GeoJson file', () => {
    const features = service.parseData(exampleGeoJson);

    /*
      - one normal Polygon
      - one polygon from a MultiLineString
      - one MultiPolygon
      - one Polygon from a LineString withing a GeometryCollection
      - one Polygon from withing a GeometryCollection
     */
    expect(features.length).toEqual(5);
  });

  it('should read OSM file', () => {
    const features = service.parseData(exampleOsm);

    expect(features.length).toEqual(3);
  });

  it('should fail on unknown file extension', () => {
    expect(service.parseData('')).toEqual([]);
    expect(service.parseData('{}')).toEqual([]);
    expect(service.parseData('{a:"b"}')).toEqual([]);
    expect(service.parseData('{\n"type": "FeatureCollection",\n"crs": {\n"type": "name",\n"properties": {\n"name": "EPSG:3857"\n}\n},\n"features": [{\n"type": "Feature",\n"geometry": {\n"type": "Point",\n"coordinates": [0,')).toEqual([]);
    // @ts-ignore
    expect(service.parseData(null)).toEqual([]);
    // @ts-ignore
    expect(service.parseData(undefined)).toEqual([]);
    expect(service.parseData(new ArrayBuffer(0))).toEqual([]);
  });
});


const exampleGpxFile = `
<gpx>
  <wpt lat="53.55425510342779" lon="9.945566643476486">
  </wpt>
  <trk>
    <trkseg>
      <trkpt lat="53.559532123118686" lon="9.942970232963562">
      </trkpt>
      <trkpt lat="53.55713588559855" lon="9.943098978996275">
      </trkpt>
      <trkpt lat="53.55718687078871" lon="9.946489291191103">
      </trkpt>
      <trkpt lat="53.559481140754805" lon="9.94631762981415">
      </trkpt>
      <trkpt lat="53.559532123118686" lon="9.942970232963562">
      </trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="53.55711039298042" lon="9.949493365287783">
      </trkpt>
      <trkpt lat="53.559608596549324" lon="9.950737910270691">
      </trkpt>
      <trkpt lat="53.55698292965938" lon="9.952583270072939">
      </trkpt>
      <trkpt lat="53.55711039298042" lon="9.949493365287783">
      </trkpt>
    </trkseg>
  </trk>
  <rte>
      <rtept lat="53.55945564954981" lon="9.95498652935028">
      </rtept>
      <rtept lat="53.557084900346936" lon="9.957175211906435">
      </rtept>
      <rtept lat="53.55726334845877" lon="9.960865931510925">
      </rtept>
      <rtept lat="53.55981252502185" lon="9.961295084953308">
      </rtept>
      <rtept lat="53.55967230518426" lon="9.959439028501508">
      </rtept>
      <rtept lat="53.55945564954981" lon="9.95498652935028">
      </rtept>
  </rte>
</gpx>
`;

const exampleGeoJson = `
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": {
      "name": "EPSG:3857"
    }
  },
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [0, 0]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [[4e6, -2e6], [8e6, 2e6]]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [[4e6, 2e6], [8e6, -2e6]]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[-5e6, -1e6], [-4e6, 1e6], [-3e6, -1e6]]]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "MultiLineString",
      "coordinates": [
        [[-1e6, -7.5e5], [-2e6, 0], [-1e6, 7.5e5], [-1e6, -7.5e5]],
        [[1e6, -7.5e5], [1e6, 7.5e5]],
        [[-7.5e5, -1e6], [7.5e5, -1e6]],
        [[-7.5e5, 1e6], [7.5e5, 1e6]]
      ]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "MultiPolygon",
      "coordinates": [
        [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6], [-3e6, 6e6]]],
        [[[-2e6, 6e6], [-2e6, 8e6], [0, 8e6], [0, 6e6]]],
        [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6], [3e6, 6e6]]]
      ]
    }
  }, {
    "type": "Feature",
    "geometry": {
      "type": "GeometryCollection",
      "geometries": [{
        "type": "LineString",
        "coordinates": [[-5e6, -5e6], [-10e6, 0], [-5e6, 5e6], [-5e6, -5e6]]
      }, {
        "type": "Point",
        "coordinates": [4e6, -5e6]
      }, {
        "type": "Polygon",
        "coordinates": [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
      }]
    }
  }]
}`;

const exampleOsm = `<?xml version='1.0' encoding='UTF-8'?>
<osm version='0.6' generator='JOSM'>
  <node id='-102866' action='modify' visible='true' lat='53.5635399425' lon='9.94572136883' />
  <node id='-102867' action='modify' visible='true' lat='53.56193448431' lon='9.94036008925' />
  <node id='-102868' action='modify' visible='true' lat='53.55886215974' lon='9.93731127543' />
  <node id='-102869' action='modify' visible='true' lat='53.55529821937' lon='9.93754290421' />
  <node id='-102870' action='modify' visible='true' lat='53.5523742059' lon='9.9409814351' />
  <node id='-102871' action='modify' visible='true' lat='53.55101867765' lon='9.94653515883' />
  <node id='-102872' action='modify' visible='true' lat='53.55166215855' lon='9.95244080736' />
  <node id='-102873' action='modify' visible='true' lat='53.55410027059' lon='9.956823379' />
  <node id='-102874' action='modify' visible='true' lat='53.55755871285' lon='9.95829143824' />
  <node id='-102875' action='modify' visible='true' lat='53.56093935099' lon='9.95637888662' />
  <node id='-102876' action='modify' visible='true' lat='53.56316898795' lon='9.95169294579' />
  <node id='-102878' action='modify' visible='true' lat='53.56141927648' lon='9.96531986265' />
  <node id='-102879' action='modify' visible='true' lat='53.56151951772' lon='9.95122213743' />
  <node id='-102880' action='modify' visible='true' lat='53.55392284551' lon='9.95106904001' />
  <node id='-102881' action='modify' visible='true' lat='53.55382258626' lon='9.96516676523' />
  <node id='-102882' action='modify' visible='true' lat='53.55369984564' lon='9.97152508096' />
  <node id='-102883' action='modify' visible='true' lat='53.55776052607' lon='9.97755743114' />
  <node id='-102884' action='modify' visible='true' lat='53.55377266776' lon='9.97769094485' />
  <node id='-102913' action='modify' visible='true' lat='53.55767707867' lon='9.97139197508' />
  <node id='-102937' action='modify' visible='true' lat='53.5537241197' lon='9.97358036893' />
  <node id='-102938' action='modify' visible='true' lat='53.55374839374' lon='9.97563565689' />
  <node id='-102939' action='modify' visible='true' lat='53.5578224344' lon='9.98213149482' />
  <node id='-102940' action='modify' visible='true' lat='53.55779461866' lon='9.9800763428' />
  <node id='-102941' action='modify' visible='true' lat='53.55961949415' lon='9.9754391644' />
  <node id='-102942' action='modify' visible='true' lat='53.55960827499' lon='9.97338343961' />
  <way id='-101907' action='modify' visible='true'>
    <nd ref='-102866' />
    <nd ref='-102867' />
    <nd ref='-102868' />
    <nd ref='-102869' />
    <nd ref='-102870' />
    <nd ref='-102871' />
    <nd ref='-102872' />
    <nd ref='-102873' />
    <nd ref='-102874' />
    <nd ref='-102875' />
    <nd ref='-102876' />
    <nd ref='-102866' />
  </way>
  <way id='-101918' action='modify' visible='true'>
    <nd ref='-102878' />
    <nd ref='-102879' />
    <nd ref='-102880' />
    <nd ref='-102881' />
    <nd ref='-102878' />
  </way>
  <way id='-101922' action='modify' visible='true'>
    <nd ref='-102882' />
    <nd ref='-102913' />
    <nd ref='-102883' />
    <nd ref='-102884' />
    <nd ref='-102938' />
    <nd ref='-102941' />
    <nd ref='-102939' />
    <nd ref='-102940' />
    <nd ref='-102942' />
    <nd ref='-102937' />
    <nd ref='-102882' />
  </way>
</osm>
`;
