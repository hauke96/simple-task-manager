import { EventEmitter, Injectable } from '@angular/core';
import { Task, TaskDto } from './task.material';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { from, Observable, throwError } from 'rxjs';
import { concatMap, map, mergeMap, tap } from 'rxjs/operators';
import { Geometry, MultiPolygon, Polygon } from 'ol/geom';
import { Extent } from 'ol/extent';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';
import GeoJSON from 'ol/format/GeoJSON';
import { Coordinate } from 'ol/coordinate';
import FeatureFormat from 'ol/format/Feature';
import { Feature } from 'ol';
import { CommentService } from '../comments/comment.service';
import { CommentDraftDto } from '../comments/comment.material';

import { JosmDataSource } from '../common/entities/josm-data-source';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();
  public tasksUpdated: EventEmitter<Task[]> = new EventEmitter();

  private selectedTask: Task | undefined;
  private format: FeatureFormat = new GeoJSON();

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private commentService: CommentService
  ) {
  }

  // Publishes the tasks via the tasksUpdated event. This is usually called from the project service when a project has been updated.
  public updateTasks(tasks: Task[]): void {
    this.tasksUpdated.emit(tasks);

    if (this.selectedTask) {
      const updatedSelectedTask = tasks.filter(t => t.id === this.selectedTask?.id);
      if (updatedSelectedTask.length !== 0) {
        this.selectedTask = updatedSelectedTask[0];
        this.selectedTaskChanged.emit(this.selectedTask);
      }
    }
  }

  public selectTask(task: Task): void {
    this.selectedTask = task;
    this.selectedTaskChanged.emit(task);
  }

  public getSelectedTask(): Task | undefined {
    return this.selectedTask;
  }

  public getTask(taskId: string): Observable<Task> {
    return this.http.get<TaskDto>(environment.url_task.replace('{id}', taskId))
      .pipe(
        mergeMap(dto => this.getUserNameMapFromDtos([dto]).pipe(map(userMap => this.toTaskWithUsers(dto, userMap)))),
        tap(task => this.selectedTaskChanged.emit(task)),
      );
  }

  public createNewTasks(geometries: string[], maxProcessPoints: number): Observable<Task[]> {
    const draftTasks = geometries.map(g => new TaskDto('', 0, maxProcessPoints, g, []));
    return this.http.post<TaskDto[]>(environment.url_tasks, JSON.stringify(draftTasks))
      .pipe(
        mergeMap(dtos => this.getUserNameMapFromDtos(dtos)
          .pipe(
            map(userMap => dtos.map(dto => this.toTaskWithUsers(dto, userMap)))
          )
        ),
        tap(tasks => tasks.forEach(t => this.selectedTaskChanged.emit(t)))
      );
  }

  public setProcessPoints(taskId: string, newProcessPoints: number): Observable<Task> {
    if (taskId !== this.selectedTask?.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.post<TaskDto>(environment.url_task_processPoints.replace('{id}', taskId) + '?process_points=' + newProcessPoints, '')
      .pipe(
        mergeMap(dto => this.getUserNameMapFromDtos([dto]).pipe(map(userMap => this.toTaskWithUsers(dto, userMap)))),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public assign(taskId: string): Observable<Task> {
    if (taskId !== this.selectedTask?.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError(() => new Error('Task with id \'' + taskId + '\' not selected'));
    }

    return this.http.post<TaskDto>(environment.url_task_assignedUser.replace('{id}', taskId), '')
      .pipe(
        mergeMap(dto => this.getUserNameMapFromDtos([dto]).pipe(map(userMap => this.toTaskWithUsers(dto, userMap)))),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public unassign(taskId: string): Observable<Task> {
    if (taskId !== this.selectedTask?.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError(() => new Error('Task with id \'' + taskId + '\' not selected'));
    }

    return this.http.delete<TaskDto>(environment.url_task_assignedUser.replace('{id}', taskId))
      .pipe(
        mergeMap(dto => this.getUserNameMapFromDtos([dto]).pipe(map(userMap => this.toTaskWithUsers(dto, userMap)))),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public addComment(taskId: string, comment: string): Observable<Task> {
    return this.http.post<TaskDto>(environment.url_task_comments.replace('{id}', taskId), JSON.stringify(new CommentDraftDto(comment)))
      .pipe(
        mergeMap(dto => this.getUserNameMapFromDtos([dto]).pipe(map(userMap => this.toTaskWithUsers(dto, userMap)))),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public openInJosm(task: Task, josmDataSource: JosmDataSource): Observable<any> {
    if (!task) {
      return throwError(() => new Error('Task is undefined'));
    }

    const geometry = task.geometry.getGeometry();
    if (!geometry) {
      return throwError(() => new Error('Geometry of task is undefined'));
    }

    // Make sequential requests to these URLs
    let coordinateString;
    switch (geometry.getType()) {
      case 'Polygon':
        coordinateString = (geometry as Polygon).getCoordinates()[0].map(c => c[1] + ' ' + c[0]).join(' ');
        break;
      case 'MultiPolygon':
        const multiPolygon = geometry as MultiPolygon;
        const polygon = multiPolygon.getPolygon(0) ;
        coordinateString = polygon.getCoordinates()[0].map(c => c[1] + ' ' + c[0]).join(' ');
        break;
      default:
        return throwError(() => new Error(`Unsupported task geometry type '${geometry.getType()}'`));
    }

    if (!coordinateString) {
      return throwError(() => new Error('Empty coordinates'));
    }

    let dataUrl = '';
    if (josmDataSource === 'OSM') {
      const e = this.getExtent(task);
      // TODO Add (default) comment with issue #161: '&changeset_comment=' + encodeURIComponent('#stm #stm-project-' + projectId + ' ')
      dataUrl = 'http://localhost:8111/load_and_zoom?new_layer=true&left=' + e[0] + '&right=' + e[2] + '&top=' + e[3] + '&bottom=' + e[1];
    } else if (josmDataSource === 'OVERPASS') {
      // eslint-disable-next-line max-len
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];nwr(poly:"${coordinateString}");out meta;(<; - rel._;);(._;>;); out meta;`;
      dataUrl = 'http://localhost:8111/import?new_layer=true&url=' + overpassUrl;
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      return throwError(() => new Error('Unknown JosmDataSource "' + josmDataSource + '". Please set a valid data source in the project settings.'));
    }

    const taskGeometryString = encodeURIComponent(this.getGeometryAsOsm(task));

    return from([
      // The task-polygon
      'http://localhost:8111/load_data?new_layer=true&layer_name=task ' + task.name + '&upload_policy=never&data=' + taskGeometryString,
      // Load data for the extent of the task
      dataUrl
    ])
      .pipe(
        concatMap(url => this.http.get(url, {responseType: 'text'}))
      );
  }

  public openInOsmOrg(task: Task, projectId: string): void {
    if (!task || !task.geometry.getGeometry()) {
      throw new Error('Task or geometry of task undefined');
    }

    const e = this.getExtent(task);
    const mapView = this.fitExtentToScreen(e, window.screen.availWidth, window.screen.availHeight);

    const comment = encodeURIComponent('#stm #stm-project-' + projectId + ' ');
    const hashtags = encodeURIComponent('#stm,#stm-project-' + projectId);

    const url = 'https://openstreetmap.org/edit?editor=id#map=' +
      `${mapView.zoom}/${mapView.centerLat}/${mapView.centerLon}&comment=${comment}&hashtags=${hashtags}`;
    window.open(url);
  }

  /**
   * Calculates the center of the map as well as the zoom-level so that the given bounding box fits into the map view. The zoom-level is the
   * XYZ specific Z value (so something between 1 and 20).
   *
   * @param bounds The bounding box of the part of the world to look at. This must have the array value format [E, N, W, S].
   * @param mapWidth The width of the screen/map.
   * @param mapHeight The height of the screen/map.
   */
  public fitExtentToScreen(bounds: Extent, mapWidth: number, mapHeight: number): { centerLat: number; centerLon: number; zoom: number } {
    if (bounds == null || bounds.length < 4) {
      return {
        centerLat: 0,
        centerLon: 0,
        zoom: 1
      };
    }

    // Padding around bounding-box in map in pixels
    const padding = 20;

    // Size of each tile in pixels
    const tileSize = 256;

    let boundsDeltaX: number;
    let centerLon: number;

    // Check if east value is greater than west value which would indicate that bounding box crosses the antimeridian.
    if (bounds[2] > bounds[0]) {
      boundsDeltaX = bounds[2] - bounds[0];
      centerLon = (bounds[2] + bounds[0]) / 2;
    } else {
      boundsDeltaX = 360 - (bounds[0] - bounds[2]);
      centerLon = ((bounds[2] + bounds[0]) / 2 + 360) % 360 - 180;
    }

    const ry1 = Math.log((Math.sin(bounds[1] * Math.PI / 180) + 1) / Math.cos(bounds[1] * Math.PI / 180));
    const ry2 = Math.log((Math.sin(bounds[3] * Math.PI / 180) + 1) / Math.cos(bounds[3] * Math.PI / 180));
    const ryc = (ry1 + ry2) / 2;

    const centerLat = Math.atan(Math.sinh(ryc)) * 180 / Math.PI;

    const resolutionHorizontal = boundsDeltaX / (mapWidth - padding * 2);

    const vy0 = Math.log(Math.tan(Math.PI * (0.25 + centerLat / 360)));
    const vy1 = Math.log(Math.tan(Math.PI * (0.25 + bounds[3] / 360)));
    const zoomFactorPowered = (mapHeight * 0.5 - padding) / (40.7436654315252 * (vy1 - vy0));
    const resolutionVertical = 360.0 / (zoomFactorPowered * tileSize);

    const resolution = Math.max(resolutionHorizontal, resolutionVertical);

    const zoom = Math.log2(360 / (resolution * tileSize));

    return {
      centerLon,
      centerLat,
      zoom
    };
  }

  /**
   * @param task The task to get the extent from. Must not be falsy and also need to have a geometry (task.geometry.getGeometry() must not
   * be falsy).
   */
  public getExtent(task: Task): Extent {
    if (!task || !task.geometry.getGeometry()) {
      throw new Error('Task or geometry of task undefined');
    }

    // @ts-ignore
    return task.geometry.getGeometry().getExtent();
  }

  public getGeometryAsOsm(task: Task): string {
    const taskFeature = task.geometry;

    let coordinates: Coordinate[] = [];
    const taskGeometry = taskFeature.getGeometry();
    switch (taskGeometry?.getType()) {
      case 'Polygon':
        coordinates = (taskGeometry as Polygon).getCoordinates()[0];
        break;
      case 'MultiPolygon':
        const multiPolygon = taskGeometry as MultiPolygon;
        const polygon = multiPolygon.getPolygon(0) ;
        coordinates = polygon.getCoordinates()[0];
        break;
      default:
        throw new Error(`Unsupported task geometry type '${taskGeometry?.getType()}'`);
    }

    let osm = '<osm version="0.6" generator="simple-task-dashboard">';

    for (let i = 0; i < coordinates.length; i++) {
      const lat = coordinates[i][1];
      const lon = coordinates[i][0];

      osm += `<node id='-${(i + 1)}' action='modify' visible='true' lat='${lat}' lon='${lon}' />`;
    }

    osm += `<way id='-${coordinates.length + 1}' action='modify' visible='true'>`;

    for (let i = 0; i < coordinates.length; i++) {
      osm += `<nd ref='-${(i + 1)}' />`;
    }

    osm += `<nd ref='-1' />`; // close the ring by adding first node again

    osm += '</way></osm>';

    return osm;
  }

  private getUserNameMapFromDtos(dtos: TaskDto[]): Observable<Map<string, User>> {
    const userIDs = dtos.flatMap(dto => dto.comments.map(c => c.authorId));
    userIDs.push(...dtos.filter(dto => !!dto.assignedUser).map(dto => dto.assignedUser as string));

    return this.userService.getUsersByIds(userIDs)
      .pipe(
        map((users: User[]) => new Map(users.map(obj => [obj.uid, obj])))
      );
  }

  public toTaskWithUsers(dto: TaskDto, userMap: Map<string, User>): Task {
    const feature = (this.format.readFeature(dto.geometry) as Feature<Geometry>);
    let assignedUser: User | undefined;

    if (dto.assignedUser) {
      assignedUser = userMap.get(dto.assignedUser) as User;
    }

    return new Task(
      dto.id,
      feature.get('name') as string,
      dto.processPoints,
      dto.maxProcessPoints,
      feature,
      this.commentService.toCommentsWithUserMap(dto.comments, userMap),
      assignedUser
    );
  }
}
