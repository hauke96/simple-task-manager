import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectCreationComponent } from './project-creation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Polygon } from 'ol/geom';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ProjectService } from '../../project/project.service';
import { Project } from '../../project/project.material';
import { Feature } from 'ol';
import { MockRouter } from '../../common/mock-router';
import { Task, TestTaskFeature } from '../../task/task.material';
import { User } from '../../user/user.material';

describe('ProjectCreationComponent', () => {
  let component: ProjectCreationComponent;
  let fixture: ComponentFixture<ProjectCreationComponent>;
  let projectService: ProjectService;
  let routerMock: MockRouter;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectCreationComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        {
          provide: Router,
          useClass: MockRouter
        }
      ]
    })
      .compileComponents();

    projectService = TestBed.inject(ProjectService);
    routerMock = TestBed.inject(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly create project', () => {
    const name = 'test name';

    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(of(createProject()));
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    const feature: Feature[] = [];
    feature.push(new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]])));
    feature.push(new Feature(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]])));

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(spyService).toHaveBeenCalled();
    expect(spyRouter).toHaveBeenCalledWith(['/manager']);
  });

  it('should not navigate on fail', () => {
    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(throwError('BOOM'));
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    const feature: Feature[] = [];
    feature.push(new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]])));
    feature.push(new Feature(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]])));

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(spyService).toHaveBeenCalled();
    expect(spyRouter).not.toHaveBeenCalled();
  });

  it('should update vector source when shapes created', () => {
    const polygons: Polygon[] = [];
    polygons.push(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    polygons.push(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]]));

    const features = polygons.map(p => new Feature(p));

    // @ts-ignore
    const spySource = spyOn(component.vectorSource, 'addFeature');
    // @ts-ignore
    const spyView = spyOn(component.map.getView(), 'fit');

    component.onShapesCreated(features);

    expect(spySource).toHaveBeenCalledTimes(2);
    expect(spyView).toHaveBeenCalled();
  });

  it('should add uploaded shape correctly', () => {
    const vectorSourceClearSpy = spyOn(component.vectorSource, 'clear').and.callThrough();
    const vectorSourceAddSpy = spyOn(component.vectorSource, 'addFeature').and.callThrough();
    // @ts-ignore
    const spyView = spyOn(component.map.getView(), 'fit');

    const feature = new Feature(new Polygon([[[0, 0]]]));
    component.onShapesUploaded([feature]);

    expect(vectorSourceClearSpy).toHaveBeenCalled();
    expect(vectorSourceAddSpy).toHaveBeenCalledWith(feature);
    expect(spyView).toHaveBeenCalled();
  });

  it('should create project with all properties', () => {
    const saveSpy = spyOn(component, 'createProject').and.callFake(() => {
    });

    const description = 'lorem ipsum';
    const maxProcessPoints = 100;
    const name = 'test project';
    const p = new Polygon([[[0, 0]]]);
    const feature = new Feature(p);

    component.projectDescription = description;
    component.newMaxProcessPoints = maxProcessPoints;
    component.newProjectName = name;
    component.vectorSource.addFeature(feature);

    component.onSaveButtonClicked();

    expect(saveSpy).toHaveBeenCalledWith(name, maxProcessPoints, description, jasmine.anything());
  });

  it('should deactivate interactions on tab selection', () => {
    component.onTabSelected();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(false);
  });

  it('should fire reset subject on tab select', () => {
    const spy = spyOn(component.resetToolbarSelectionSubject, 'next');

    component.onTabSelected();

    expect(spy).toHaveBeenCalled();
  });

  it('should zoom in', () => {
    // @ts-ignore
    const z = component.map.getView().getZoom();

    component.onZoomIn();

    // @ts-ignore
    expect(component.map.getView().getZoom()).toEqual(z + 1);
  });

  it('should zoom out', () => {
    // @ts-ignore
    const z = component.map.getView().getZoom();

    component.onZoomOut();

    // @ts-ignore
    expect(component.map.getView().getZoom()).toEqual(z - 1);
  });

  it('should toggle draw and modify interactions correctly', () => {
    component.onToggleDraw();

    expect(component.drawInteraction.getActive()).toEqual(true);
    expect(component.modifyInteraction.getActive()).toEqual(true);
    expect(component.removeInteraction.getActive()).toEqual(false);

    component.onToggleDraw();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(false);
  });

  it('should deactivate delete interaction on draw', () => {
    component.removeInteraction.setActive(true);

    component.onToggleDraw();

    expect(component.removeInteraction.getActive()).toEqual(false);
  });

  it('should toggle delete interactions correctly', () => {
    component.onToggleDelete();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(true);

    component.onToggleDelete();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(false);
  });

  it('should deactivate draw and modify interaction on delete', () => {
    component.drawInteraction.setActive(true);
    component.modifyInteraction.setActive(true);

    component.onToggleDraw();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
  });

  function createProject() {
    const t = new Task('567', undefined, 10, 100, TestTaskFeature);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }
});
