import { Feature } from 'ol';
import { Polygon } from 'ol/geom';

export class TaskDto {
  constructor(
    public id: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: string,
    public assignedUser?: string,
    public assignedUserName?: string
  ) {
  }
}

export class Task {
  constructor(
    public id: string,
    public name: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: Feature,
    // TODO instead store an actual User object
    public assignedUser?: string,
    public assignedUserName?: string
  ) {
  }
}

export const TestTaskFeature = new Feature(new Polygon([[[0, 0], [1, 1], [1, 2]]]));
export const TestTaskGeometry = '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[0, 0], [1, 1], [1, 2]]]},"properties":null}';
