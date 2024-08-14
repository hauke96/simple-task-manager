import { Feature } from 'ol';
import { Geometry, Polygon } from 'ol/geom';
import { User } from '../user/user.material';
import { Comment, CommentDto } from '../comments/comment.material';

export class TaskDraftDto {
  /**
   * @param maxProcessPoints Amount of process points to complete this task.
   * @param geometry Polygon feature encoded as GeoJSON.
   */
  constructor(
    public maxProcessPoints: number,
    public processPoints: number,
    public geometry: string
  ) {
  }
}

export class TaskDraft {
  constructor(
    public id: string,
    public name: string,
    public geometry: Geometry,
    public processPoints: number
  ) {
  }
}

export class TaskDto {
  constructor(
    public id: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: string,
    public comments: CommentDto[],
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
    public geometry: Feature<Geometry>,
    public comments: Comment[],
    public assignedUser?: User
  ) {
  }

  public get isDone(): boolean {
    return this.processPoints === this.maxProcessPoints;
  }
}

export class TaskExport {
  constructor(
    public name: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: string,
    public assignedUser?: string) {
  }
}

export const TestTaskFeature = new Feature(new Polygon([[[0, 0], [1, 1], [1, 2]]]));
export const TestTaskGeometry = '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[0, 0], [1, 1], [1, 2]]]},"properties":null}';
