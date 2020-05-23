import { EventEmitter, Injectable } from '@angular/core';
import { Task } from './task.material';
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

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();

  private selectedTask: Task;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {
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
      return new Task('', 0, maxProcessPoints, g);
    });
    return this.http.post<Task[]>(environment.url_tasks, JSON.stringify(draftTasks))
      .pipe(flatMap(tasks => this.addUserNames(tasks)));
  }

  public setProcessPoints(taskId: string, newProcessPoints: number): Observable<Task> {
    if (taskId !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.post<Task>(environment.url_task_processPoints.replace('{id}', taskId) + '?process_points=' + newProcessPoints, '')
      .pipe(flatMap(task => this.addUserName(task)))
      .pipe(tap(t => this.selectedTaskChanged.emit(t)));
  }

  public assign(taskId: string): Observable<Task> {
    if (taskId !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.post<Task>(environment.url_task_assignedUser.replace('{id}', taskId), '')
      .pipe(flatMap(task => this.addUserName(task)))
      .pipe(tap(t => this.selectedTaskChanged.emit(t)));
  }

  public unassign(taskId: string): Observable<Task> {
    if (taskId !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      return throwError('Task with id \'' + taskId + '\' not selected');
    }

    return this.http.delete<Task>(environment.url_task_assignedUser.replace('{id}', taskId))
      .pipe(tap(t => this.selectedTaskChanged.emit(t)));
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

  public getExtent(task: Task): Extent {
    return new GeoJSON().readFeature(task.geometry).getGeometry().getExtent();
  }

  public getGeometryAsOsm(task: Task): string {
    const format = new GeoJSON();
    const taskFeature = format.readFeature(task.geometry);
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
  public addUserNames(tasks: Task[]): Observable<Task[]> {
    const userIDs = tasks.filter(t => !!t.assignedUser && t.assignedUser !== '').map(t => t.assignedUser);

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

  public addUserName(task: Task): Observable<Task> {
    return this.addUserNames([task]).pipe(map(t => t[0]));
  }
}
