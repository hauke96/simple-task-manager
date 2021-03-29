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
import { SelectEvent } from 'ol/interaction/Select';
import { DrawEvent } from 'ol/interaction/Draw';
import { TaskDraftService } from '../task-draft.service';
import { TaskDraft } from '../../task/task.material';

describe('ProjectCreationComponent', () => {
  let component: ProjectCreationComponent;
  let fixture: ComponentFixture<ProjectCreationComponent>;
  let projectService: ProjectService;
  let taskDraftService: TaskDraftService;
  let routerMock: MockRouter;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectCreationComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        TaskDraftService,
        {
          provide: Router,
          useClass: MockRouter
        }
      ]
    })
      .compileComponents();

    projectService = TestBed.inject(ProjectService);
    taskDraftService = TestBed.inject(TaskDraftService);
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

  it('should add new tasks to map', () => {
    // @ts-ignore
    const spyMapView = spyOn(component.map.getView(), 'fit');

    const tasks = getDummyTasks();
    expect(component.vectorSource.getFeatures().length).toEqual(0);

    // @ts-ignore
    component.addTasks(tasks);

    expect(component.vectorSource.getFeatures().length).toEqual(tasks.length);
    expect(spyMapView).toHaveBeenCalled();
  });

  it('should return tasks correctly', () => {
    const spy = spyOn(taskDraftService, 'getTasks');

    const x = component.taskDrafts;

    expect(spy).toHaveBeenCalled();
  });

  it('should correctly create project', () => {
    const name = 'test name';

    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(of(createProject()));
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    const feature = getDummyFeatures();

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(spyService).toHaveBeenCalled();
    expect(spyRouter).toHaveBeenCalledWith(['/manager']);
  });

  it('should not navigate on fail', () => {
    const name = 'test name';

    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(throwError('BOOM'));
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    const feature = getDummyFeatures();

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(spyService).toHaveBeenCalled();
    expect(spyRouter).not.toHaveBeenCalled();
  });

  it('should add uploaded shape correctly', () => {
    const vectorSourceClearSpy = spyOn(component.vectorSource, 'clear');
    const vectorSourceAddSpy = spyOn(component.vectorSource, 'addFeatures');
    // @ts-ignore
    const spyView = spyOn(component.map.getView(), 'fit');

    const tasks = getDummyTasks();
    // @ts-ignore
    component.addTasks(tasks);

    expect(vectorSourceClearSpy).not.toHaveBeenCalled();
    expect((vectorSourceAddSpy.calls.first().args[0] as Feature[])[0].getGeometry()).toEqual(tasks[0].geometry);
    expect((vectorSourceAddSpy.calls.first().args[0] as Feature[])[1].getGeometry()).toEqual(tasks[1].geometry);
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

    component.projectProperties.projectDescription = description;
    component.projectProperties.maxProcessPoints = maxProcessPoints;
    component.projectProperties.projectName = name;
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
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(false);
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleDraw();

    expectInteractionsToBeInDefaultState();
  });

  it('should toggle delete interactions correctly', () => {
    component.onToggleDelete();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(true);
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleDelete();

    expectInteractionsToBeInDefaultState();
  });

  it('should toggle edit interactions correctly', () => {
    component.onToggleEdit();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(true);
    expect(component.removeInteraction.getActive()).toEqual(false);
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleEdit();

    expectInteractionsToBeInDefaultState();
  });

  it('should add feature on draw interaction', () => {
    component.drawInteraction.dispatchEvent({
      type: 'drawend',
      feature: new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]])),
      target: undefined,
      preventDefault: undefined,
      stopPropagation: undefined
    } as DrawEvent);

    expect(component.vectorSource.getFeatures().length).toEqual(1);
    expect(component.vectorSource.getFeatures()[0].get('id')).toEqual('0');
    expect(component.vectorSource.getFeatures()[0].get('name')).toEqual('0');
  });

  it('should remove feature on remove interaction', () => {
    const spy = spyOn(taskDraftService, 'removeTask');

    const feature = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    feature.set('id', '123');

    component.removeInteraction.dispatchEvent({
      type: 'select',
      selected: [feature],
      deselected: [],
      stopPropagation: undefined,
      preventDefault: undefined,
      target: undefined,
      mapBrowserEvent: undefined
    } as SelectEvent);

    expect(spy).toHaveBeenCalledWith('123');
  });

  it('should select feature on select interaction', () => {
    const spySelect = spyOn(taskDraftService, 'selectTask');

    const feature = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    feature.set('id', '123');

    component.selectInteraction.dispatchEvent({
      type: 'select',
      selected: [feature],
      deselected: [],
      stopPropagation: undefined,
      preventDefault: undefined,
      target: undefined,
      mapBrowserEvent: undefined
    } as SelectEvent);

    expect(spySelect).toHaveBeenCalledWith('123');
  });

  function expectInteractionsToBeInDefaultState() {
    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(false);

    // Selection is enabled when all other interactions aren't
    expect(component.selectInteraction.getActive()).toEqual(true);
  }

  function createProject() {
    const t = new Task('567', undefined, 10, 100, TestTaskFeature);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1, true, new Date());
  }

  function getDummyFeatures() {
    const feature: Feature[] = [];
    feature.push(new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]])));
    feature.push(new Feature(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]])));
    return feature;
  }

  function getDummyTasks(): TaskDraft[] {
    return [
      new TaskDraft('1', 'name 1', new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]), 0),
      new TaskDraft('1', 'name 1', new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]]), 0)
    ];
  }
});
