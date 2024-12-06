import { Injectable } from '@angular/core';
import { TaskDraft } from '../task/task.material';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskDraftService {
  private tasks: TaskDraft[] = [];
  private selectedTask: TaskDraft | undefined;

  public tasksAdded: Subject<TaskDraft[]> = new Subject<TaskDraft[]>();
  public taskRemoved: Subject<string> = new Subject<string>();
  public taskChanged: Subject<TaskDraft> = new Subject<TaskDraft>();
  public taskSelected: Subject<void> = new Subject();

  constructor() {
  }

  public getTasks(): TaskDraft[] {
    return this.tasks;
  }

  public selectTask(id: string): void {
    if (this.selectedTask?.id == id) {
      this.deselectTask();
      return;
    }

    this.selectedTask = this.tasks.find(t => t.id === id);

    if (!!this.selectedTask) {
      this.taskSelected.next();
    }
  }

  public deselectTask(): void {
    this.selectedTask = undefined;
    this.taskSelected.next();
  }

  public getSelectedTask(): TaskDraft | undefined {
    return this.selectedTask;
  }

  public removeTask(id: string): void {
    // Check if task exists before filtering anything.
    if (this.tasks.filter(t => t.id === id).length !== 0) {
      this.tasks = this.tasks.filter(t => t.id !== id);

      if (!!this.selectedTask && this.selectedTask.id === id) {
        this.deselectTask();
      }

      this.taskRemoved.next(id);
    }
  }

  public changeTaskName(id: string, name: string): void {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      return;
    }

    task.name = name;

    if (!!this.selectedTask && this.selectedTask.id === id) {
      this.selectedTask = task;
    }

    this.taskChanged.next(task);
  }

  /**
   * Creates an empty (=no process points) tasks from a feature.
   */
  public toTaskDraft(feature: Feature<Geometry>): TaskDraft {
    return new TaskDraft(
      feature.get('id'),
      feature.get('name'),
      // TODO Handle not existing geometry
      // @ts-ignore
      feature.getGeometry(),
      0
    );
  }

  /**
   * This function takes the task drafts and stores them in the service cache. Use the *transformGeometry* parameter to control whether the
   * geometry projection should be adjusted or not. The destination projection is 'EPSG:3857'.
   *
   * All tasks without any valid ID (check *hasIntegerId()*) will get a new valid ID. If the name is not set, the *name* property will  be
   * filled with the ID of the task.
   *
   * @param tasks The new tasks that should be added to the map
   * @param transformGeometry Default: true. Set to false if all geometries of the tasks are already in 'EPSG:3857' (no transformation
   * needed) and to true if the geometries are in 'EPSG:4326' projection.
   */
  public addTasks(tasks: TaskDraft[], transformGeometry = true): void {
    // Transform geometries into the correct projection
    tasks.forEach(f => {
      if (transformGeometry) {
        f.geometry.transform('EPSG:4326', 'EPSG:3857');
      }

      // The ID should be a string in general, so the else-clause turns a number into a string.
      const id = f.id;
      if (!this.hasIntegerId(f)) {
        f.id = this.findSmallestId(tasks.concat(this.tasks));
      } else {
        f.id = id + '';
      }

      const name = f.name;
      if (!name || name.trim() === '') {
        f.name = f.id;
      }
    });

    this.tasks.push(...tasks);
    this.tasksAdded.next(tasks);
  }

  /**
   * Goes through all tasks and finds the smallest non-negative number that's not currently an ID of one of them.
   *
   * ### Example:
   *
   * The IDs of the given tasks are: 4, 1, 2, 0
   *
   * The output of this function would be: 3
   */
  private findSmallestId(tasks: TaskDraft[]): string {
    let currentId = 0;

    this.sortTasksById(tasks).forEach(f => {
      const id = f?.id;
      // @ts-ignore +undefined results in NaN which is ok here
      if (+id === currentId) {
        currentId++;
      }
    });

    return currentId + '';
  }

  /**
   * This does two things: Filter the tasks by an valid integer ID (see *hasIntegerId()*) and sorts the remaining ones by their ID.
   */
  private sortTasksById(tasks: TaskDraft[]): TaskDraft[] {
    return tasks
      .filter(f => this.hasIntegerId(f))
      .sort((f1: TaskDraft, f2: TaskDraft) => +(f1?.id ?? 0) - +(f2?.id ?? 0));
  }

  /**
   * Returns true when the ID of the task is a non-negative integer.
   *
   * Examples when this function will return *true*: 0, 1, '1'
   *
   * Examples when this function will return *false*: -1, '-1, undefined, null, 'one', ''
   */
  private hasIntegerId(f: TaskDraft): boolean {
    const id: number = parseFloat(f?.id ?? '');
    return Number.isInteger(id) && id >= 0;
  }

  public hasTasks(): boolean {
    return this.tasks.length > 0;
  }
}
