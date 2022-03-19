import { CopyProjectComponent } from './copy-project.component';
import { Project, ProjectExport } from '../../project/project.material';
import { ProjectService } from '../../project/project.service';
import { of, throwError } from 'rxjs';
import { ProjectImportService } from '../project-import.service';
import { NotificationService } from '../../common/services/notification.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { TranslateService } from '@ngx-translate/core';

describe(CopyProjectComponent.name, () => {
  let component: CopyProjectComponent;
  let fixture: MockedComponentFixture<CopyProjectComponent>;
  let projectService: ProjectService;
  let projectImportService: ProjectImportService;
  let notificationService: NotificationService;
  let translateService: TranslateService;

  beforeEach(() => {
    projectService = {} as ProjectService;
    projectImportService = {} as ProjectImportService;
    notificationService = {} as NotificationService;
    translateService = {} as TranslateService;

    return MockBuilder(CopyProjectComponent, AppModule)
      .provide({provide: ProjectService, useFactory: () => projectService})
      .provide({provide: ProjectImportService, useFactory: () => projectImportService})
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: TranslateService, useFactory: () => translateService});
  });

  beforeEach(() => {
    fixture = MockRender(CopyProjectComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select project correctly', () => {
    const project = {id: '123'} as Project;

    component.onProjectClicked(project);
    expect(component.selectedProject).toEqual(project);

    component.onProjectClicked(project);
    expect(component.selectedProject).toBeUndefined();
  });

  it('should call export method', () => {
    projectService.getProjectExport = jest.fn().mockReturnValue(of());
    component.selectedProject = {id: '123'} as Project;

    component.onImportClicked();

    expect(projectService.getProjectExport).toHaveBeenCalledWith(component.selectedProject.id);
  });

  it('should call import service correctly', () => {
    const projectExport = {name: 'my project'} as ProjectExport;
    component.selectedProject = {id: '123'} as Project;
    projectService.getProjectExport = jest.fn().mockReturnValue(of(projectExport));
    projectImportService.importProjectAsNewProject = jest.fn();

    component.onImportClicked();

    expect(projectImportService.importProjectAsNewProject).toHaveBeenCalledTimes(1);
    expect(projectImportService.importProjectAsNewProject).toHaveBeenCalledWith(projectExport);
    expect(component.selectedProject).toBeUndefined();
  });

  it('should not import on undefined project', () => {
    component.selectedProject = undefined;
    projectService.getProjectExport = jest.fn();
    projectImportService.importProjectAsNewProject = jest.fn();

    component.onImportClicked();

    expect(projectService.getProjectExport).not.toHaveBeenCalled();
    expect(projectImportService.importProjectAsNewProject).not.toHaveBeenCalled();
    expect(component.selectedProject).toBeUndefined();
  });

  it('should show notification on import error', () => {
    component.selectedProject = {id: '123'} as Project;
    projectService.getProjectExport = jest.fn().mockReturnValue(throwError(() => new Error('some error')));
    notificationService.addError = jest.fn();
    translateService.instant = jest.fn();

    component.onImportClicked();

    expect(notificationService.addError).toHaveBeenCalled();
    expect(component.selectedProject).toBeUndefined();
  });
});
