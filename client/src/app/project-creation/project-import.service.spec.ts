import { ProjectImportService } from './project-import.service';
import { TaskDraftService } from './task-draft.service';
import { ProjectService } from '../project/project.service';
import { NotificationService } from '../common/services/notification.service';

describe(ProjectImportService.name, () => {
  let service: ProjectImportService;
  let taskDraftService: TaskDraftService;
  let projectService: ProjectService;
  let notificationService: NotificationService;

  beforeEach(() => {
    taskDraftService = {} as TaskDraftService;
    projectService = {} as ProjectService;
    notificationService = {} as NotificationService;

    service = new ProjectImportService(taskDraftService, projectService, notificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
