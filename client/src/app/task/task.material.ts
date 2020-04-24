import { Polygon } from 'ol/geom';
import { Extent } from 'ol/extent';

export class Task {
  constructor(
    public id: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: [number, number][],
    public assignedUser?: string
  ) {
  }

  public getExtent(): Extent {
    return new Polygon([this.geometry]).getExtent();
  }

  public getGeometryAsOsm(): string {
    let osm = '<osm version="0.6" generator="simple-task-manager">';

    for (let i = 0; i < this.geometry.length; i++) {
      osm += '<node id=\'-' + (i + 1) + '\' action=\'modify\' visible=\'true\' lat=\'' + this.geometry[i][1] + '\' lon=\'' + this.geometry[i][0] + '\' />';
    }

    osm += '<way id=\'-' + this.geometry.length + '\' action=\'modify\' visible=\'true\'>';

    for (let i = 0; i < this.geometry.length; i++) {
      osm += '<nd ref=\'-' + (i + 1) + '\' />';
    }

    osm += '<nd ref=\'-1\' />'; // close the ring

    osm += '</way></osm>';

    return osm;
  }
}
