import { Geometry } from 'ol/geom';

export class TaskDraft {
  constructor(
    private id: string,
    private name: string,
    private geometry: Geometry
  ) {
  }
}
