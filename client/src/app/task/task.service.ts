import { EventEmitter, Injectable } from '@angular/core';
import { Task } from './task.material';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { from, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Polygon } from 'ol/geom';
import { Extent } from 'ol/extent';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  public selectedTaskChanged: EventEmitter<Task> = new EventEmitter();

  private selectedTask: Task;

  constructor(private http: HttpClient) {
  }

  public selectTask(task: Task) {
    this.selectedTask = task;
    this.selectedTaskChanged.emit(task);
  }

  public getSelectedTask(): Task {
    return this.selectedTask;
  }

  public createNewTasks(geometries: [number, number][][], maxProcessPoints: number): Observable<Task[]> {
    const tasks = geometries.map(g => new Task('', 0, maxProcessPoints, g));
    return this.http.post<Task[]>(environment.url_tasks, JSON.stringify(tasks));
  }

  public setProcessPoints(id: string, newProcessPoints: number) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw new Error('Task with id \'' + id + '\' not selected');
    }

    // TODO return and do error handling
    this.http.post<Task>(environment.url_task_processPoints.replace('{id}', id) + '?process_points=' + newProcessPoints, '')
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public assign(id: string, user: string) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw new Error('Task with id \'' + id + '\' not selected');
    }

    // TODO return and do error handling
    this.http.post<Task>(environment.url_task_assignedUser.replace('{id}', id), '')
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public unassign(id: string) {
    if (id !== this.selectedTask.id) { // otherwise the "selectedTaskChanged" event doesn't seems right here
      throw new Error('Task with id \'' + id + '\' not selected');
    }

    // TODO return and do error handling
    this.http.delete<Task>(environment.url_task_assignedUser.replace('{id}', id))
      .subscribe(t => this.selectedTaskChanged.emit(t));
  }

  public openInJosm(task: Task) {
    const e = this.getExtent(task);

    // Make sequential requests to these URLs
    return from([
      'http://localhost:8111/load_data?new_layer=true&layer_name=task-shape&data=' + encodeURIComponent(this.getGeometryAsOsm(task)),
      'http://localhost:8111/load_and_zoom?new_layer=true&left=' + e[0] + '&right=' + e[2] + '&top=' + e[3] + '&bottom=' + e[1]
    ])
      .pipe(
        concatMap(url => {
          console.log('Call: ' + url);
          return this.http.get(url, {responseType: 'text'});
        })
      );
  }

  public getExtent(task: Task): Extent {
    return new Polygon([task.geometry]).getExtent();
  }

  public getGeometryAsOsm(task: Task): string {
    let osm = '<osm version="0.6" generator="simple-task-manager">';

    for (let i = 0; i < task.geometry.length; i++) {
      const lat = task.geometry[i][1];
      const lon = task.geometry[i][0];

      osm += `<node id='-${(i + 1)}' action='modify' visible='true' lat='${lat}' lon='${lon}' />`;
    }

    osm += `<way id='-${task.geometry.length + 1}' action='modify' visible='true'>`;

    for (let i = 0; i < task.geometry.length; i++) {
      osm += `<nd ref='-${(i + 1)}' />`;
    }

    osm += `<nd ref='-1' />`; // close the ring by adding first node again

    osm += '</way></osm>';

    return osm;
  }
}
