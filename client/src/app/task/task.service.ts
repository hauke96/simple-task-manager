import { EventEmitter, Injectable } from '@angular/core';
import { Task, TaskDto } from './task.material';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { from, Observable, of, throwError } from 'rxjs';
import { concatMap, flatMap, map, tap } from 'rxjs/operators';
import { Polygon } from 'ol/geom';
import { Extent } from 'ol/extent';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';
import GeoJSON from 'ol/format/GeoJSON';
import { Coordinate } from 'ol/coordinate';
import FeatureFormat from 'ol/format/Feature';
import { Feature } from 'ol';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();
  public tasksUpdated: EventEmitter<Task[]> = new EventEmitter();

  private selectedTask: Task;
  private format: FeatureFormat = new GeoJSON();

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {
  }

  // Publishes the tasks via the tasksUpdated event. This is usually called from the project service when a project has been updated.
  public updateTasks(tasks: Task[]) {
    this.tasksUpdated.emit(tasks);

    if (this.selectedTask) {
      const updatedSelectedTask = tasks.filter(t => t.id === this.selectedTask.id);
      if (updatedSelectedTask.length !== 0) {
        this.selectedTaskChanged.emit(updatedSelectedTask[0]);
      }
    }
  }

  public selectTask(task: Task) {
    this.selectedTask = task;
    this.selectedTaskChanged.emit(task);
  }

  public getSelectedTask(): Task {
    return this.selectedTask;
  }

  public createNewTasks(geometries: string[], maxProcessPoints: number): Observable<Task[]> {
    const draftTasks = geometries.map(g => {
      return new TaskDto('', 0, maxProcessPoints, g);
    });
    return this.http.post<TaskDto[]>(environment.url_tasks, JSON.stringify(draftTasks))
      .pipe(
        flatMap((tasks: TaskDto[]) => this.addUserNames(tasks)),
        map(dtos => dtos.map(dto => this.toTask(dto))),
        tap(tasks => tasks.forEach(t => this.selectedTaskChanged.emit(t)))
      );
  }

  public setProcessPoints(taskId: string, newProcessPoints: number): Observable<Task> {
    if (taskId !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.post<TaskDto>(environment.url_task_processPoints.replace('{id}', taskId) + '?process_points=' + newProcessPoints, '')
      .pipe(
        flatMap(task => this.addUserName(task)),
        map(dto => this.toTask(dto)),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public assign(taskId: string): Observable<Task> {
    if (taskId !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.post<TaskDto>(environment.url_task_assignedUser.replace('{id}', taskId), '')
      .pipe(
        flatMap(task => this.addUserName(task)),
        map(dto => this.toTask(dto)),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public unassign(taskId: string): Observable<Task> {
    if (taskId !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.delete<TaskDto>(environment.url_task_assignedUser.replace('{id}', taskId))
      .pipe(
        map(dto => this.toTask(dto)),
        tap(t => this.selectedTaskChanged.emit(t))
      );
  }

  public openInJosm(task: Task, projectId: string) {
    const e = this.getExtent(task);

    // Make sequential requests to these URLs
    return from([
      // The task-polygon
      'http://localhost:8111/load_data?new_layer=true&layer_name=task-shape&data=' + encodeURIComponent(this.getGeometryAsOsm(task)),
      // Load data for the extent of the task
      'http://localhost:8111/load_and_zoom?new_layer=true&left=' + e[0] + '&right=' + e[2] + '&top=' + e[3] + '&bottom=' + e[1] + '&changeset_comment=' + encodeURIComponent('#stm #stm-project-' + projectId + ' ')
    ])
      .pipe(
        concatMap(url => {
          return this.http.get(url, {responseType: 'text'});
        })
      );
  }

  public openInOsmOrg(task: Task, projectId: string) {
    const e = this.getExtent(task);
    const mapView = this.fitExtentToScreen(e, window.screen.availWidth, window.screen.availHeight);

    const comment = encodeURIComponent('#stm #stm-project-' + projectId + ' ');
    const hashtags = encodeURIComponent('#stm,#stm-project-' + projectId);

    window.open('https://openstreetmap.org/edit?editor=id#map=' + mapView.zoom + '/' + mapView.centerLat + '/' + mapView.centerLon + '&comment=' + comment + '&hashtags=' + hashtags);
  }

  /**
   * Calculates the center of the map as well as the zoom-level so that the given bounding box fits into the map view. The zoom-level is the
   * XYZ specific Z value (so something between 1 and 20).
   *
   * @param bounds The bounding box of the part of the world to look at. This must have the array value format [E, N, W, S].
   * @param mapWidth The width of the screen/map.
   * @param mapHeight The height of the screen/map.
   */
  public fitExtentToScreen(bounds: Extent, mapWidth: number, mapHeight: number): { centerLat: number, centerLon: number, zoom: number } {
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
    let centerLat: number;
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

    centerLat = Math.atan(Math.sinh(ryc)) * 180 / Math.PI;

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

  public getExtent(task: Task): Extent {
    return task.geometry.getGeometry().getExtent();
  }

  public getGeometryAsOsm(task: Task): string {
    const taskFeature = task.geometry;
    const taskPolygon = taskFeature.getGeometry() as Polygon;
    const coordinates: Coordinate[] = taskPolygon.getCoordinates()[0];

    let osm = '<osm version="0.6" generator="simple-task-manager">';

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

  // Fills the "assignedUserName" of the task with the actual user name.
  public addUserNames(tasks: TaskDto[]): Observable<TaskDto[]> {
    const userIDs = tasks.filter(t => !!t.assignedUser).map(t => t.assignedUser);

    if (!userIDs || userIDs.length === 0) {
      return of(tasks);
    }

    return this.userService.getUsersByIds(userIDs)
      .pipe(
        map((users: User[]) => {
          for (const t of tasks) {
            const user = users.find(u => t.assignedUser === u.uid);
            if (!!user) {
              t.assignedUserName = user.name;
            }
          }
          return tasks;
        })
      );
  }

  public addUserName(task: TaskDto): Observable<TaskDto> {
    return this.addUserNames([task]).pipe(map(t => t[0]));
  }

  public toTask(dto: TaskDto): Task {
    const feature = (this.format.readFeature(dto.geometry) as Feature);

    const assignedUser = dto.assignedUser ? new User(dto.assignedUserName, dto.assignedUser) : undefined;

    return new Task(
      dto.id,
      feature.get('name'),
      dto.processPoints,
      dto.maxProcessPoints,
      feature,
      assignedUser
    );
  }
}
