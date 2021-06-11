import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyProjectComponent } from './copy-project.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Project, ProjectExport } from '../../project/project.material';
import { ProjectService } from '../../project/project.service';
import { of, throwError } from 'rxjs';
import { ProjectImportService } from '../project-import.service';
import { NotificationService } from '../../common/notification.service';

describe('CopyProjectComponent', () => {
  let component: CopyProjectComponent;
  let fixture: ComponentFixture<CopyProjectComponent>;
  let projectService: ProjectService;
  let projectImportService: ProjectImportService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CopyProjectComponent],
      imports: [HttpClientTestingModule]
    })
      .compileComponents();

    projectService = TestBed.inject(ProjectService);
    projectImportService = TestBed.inject(ProjectImportService);
    notificationService = TestBed.inject(NotificationService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyProjectComponent);
    component = fixture.componentInstance;
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
    const spy = spyOn(projectService, 'getProjectExport').and.returnValue(of());
    component.selectedProject = {id: '123'} as Project;

    component.onImportClicked();

    expect(spy).toHaveBeenCalledWith(component.selectedProject.id);
  });

  it('should call import service correctly', () => {
    const projectExport = {name: 'my project'} as ProjectExport;
    component.selectedProject = {id: '123'} as Project;
    spyOn(projectService, 'getProjectExport').and.returnValue(of(projectExport));
    const spy = spyOn(projectImportService, 'importProjectAsNewProject');

    component.onImportClicked();

    expect(spy).toHaveBeenCalledOnceWith(projectExport);
    expect(component.selectedProject).toBeUndefined();
  });

  it('should not import on undefined project', () => {
    component.selectedProject = undefined;
    const spyGetExport = spyOn(projectService, 'getProjectExport');
    const spyImport = spyOn(projectImportService, 'importProjectAsNewProject');

    component.onImportClicked();

    expect(spyGetExport).not.toHaveBeenCalled();
    expect(spyImport).not.toHaveBeenCalled();
    expect(component.selectedProject).toBeUndefined();
  });

  it('should show notification on import error', () => {
    component.selectedProject = {id: '123'} as Project;
    spyOn(projectService, 'getProjectExport').and.returnValue(throwError('some error'));
    const spy = spyOn(notificationService, 'addError');

    component.onImportClicked();

    expect(spy).toHaveBeenCalled();
    expect(component.selectedProject).toBeUndefined();
  });
});
