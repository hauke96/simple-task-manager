import { Geometry } from 'ol/geom';

export class TaskDraft {
  constructor(
    public id: string,
    public name: string,
    public geometry: Geometry
  ) {
  }
}
