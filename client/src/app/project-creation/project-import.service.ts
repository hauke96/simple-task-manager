import { EventEmitter, Injectable } from '@angular/core';
import { ProjectExport } from '../project/project.material';
import { ProjectProperties } from './project-properties';
import { TaskDraftService } from './task-draft.service';
import { TaskDraft } from '../task/task.material';
import { Feature } from 'ol';
import FeatureFormat from 'ol/format/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { ProjectService } from '../project/project.service';
import { NotificationService } from '../common/notification.service';
import { Geometry } from 'ol/geom';

@Injectable({
  providedIn: 'root'
})
export class ProjectImportService {
  public projectPropertiesImported: EventEmitter<ProjectProperties> = new EventEmitter<ProjectProperties>();

  private format: FeatureFormat = new GeoJSON();

  constructor(
    private taskDraftService: TaskDraftService,
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {
  }

  /**
   * Copies the project export properties and all tasks but without the process points.
   */
  public importProjectAsNewProject(project: ProjectExport): void {
    // TODO Handle this correctly when there are task specific max-point amounts (s. #139).
    // Until #139 is not implemented, we can assume here that all maxProcessPoints values are the same, so just pick the first one.
    const maxProcessPoints = project.tasks[0].maxProcessPoints;
    const projectProperties = new ProjectProperties(project.name, maxProcessPoints, project.description);
    this.projectPropertiesImported.next(projectProperties);

    const tasksWithGeometries = project.tasks.filter(t => !!t.geometry);

    const taskDrafts = tasksWithGeometries.map(t => {
      const taskFeature = this.format.readFeature(t.geometry) as Feature<Geometry>;
      // @ts-ignore
      return new TaskDraft(undefined, t.name, taskFeature.getGeometry(), 0);
    });

    this.taskDraftService.addTasks(taskDrafts);
  }

  /**
   * Copies the project export properties and all tasks including the process points.
   */
  public importProject(project: ProjectExport): void {
    this.projectService.importProject(project)
      .subscribe(() => this.notificationService.addInfo('Project imported'));
  }
}
