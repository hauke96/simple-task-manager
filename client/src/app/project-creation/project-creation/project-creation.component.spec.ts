import { ProjectCreationComponent } from './project-creation.component';
import { Geometry, Point, Polygon } from 'ol/geom';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ProjectService } from '../../project/project.service';
import { Project } from '../../project/project.material';
import { Feature } from 'ol';
import { Task, TaskDraft, TestTaskFeature } from '../../task/task.material';
import { User } from '../../user/user.material';
import { SelectEvent } from 'ol/interaction/Select';
import { DrawEvent } from 'ol/interaction/Draw';
import { TaskDraftService } from '../task-draft.service';
import { CurrentUserService } from '../../user/current-user.service';
import { MapLayerService } from '../../common/services/map-layer.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../common/services/notification.service';
import { ProjectImportService } from '../project-import.service';
import { ConfigProvider } from '../../config/config.provider';
import { EventEmitter } from '@angular/core';

describe(ProjectCreationComponent.name, () => {
  let component: ProjectCreationComponent;
  let fixture: MockedComponentFixture<ProjectCreationComponent, any>;
  let projectService: ProjectService;
  let taskDraftService: TaskDraftService;
  let router: Router;
  let currentUserService: CurrentUserService;
  let mapLayerService: MapLayerService;
  let notificationService: NotificationService;
  let projectImportService: ProjectImportService;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    projectService = {} as ProjectService;
    projectService.getProjects = jest.fn().mockReturnValue([]);
    taskDraftService = {} as TaskDraftService;
    taskDraftService.tasksAdded = new EventEmitter<TaskDraft[]>();
    taskDraftService.taskChanged = new EventEmitter<TaskDraft>();
    taskDraftService.taskRemoved = new EventEmitter<string>();
    taskDraftService.taskSelected = new EventEmitter();
    taskDraftService.getTasks = jest.fn().mockReturnValue([]);
    taskDraftService.addTasks = jest.fn();
    taskDraftService.removeTask = jest.fn();
    taskDraftService.selectTask = jest.fn();
    taskDraftService.toTaskDraft = jest.fn();
    currentUserService = {} as CurrentUserService;
    router = {} as Router;
    mapLayerService = {} as MapLayerService;
    mapLayerService.addLayer = jest.fn();
    mapLayerService.removeLayer = jest.fn();
    mapLayerService.addInteraction = jest.fn();
    notificationService = {} as NotificationService;
    projectImportService = {} as ProjectImportService;
    projectImportService.projectPropertiesImported = new EventEmitter();
    configProvider = {} as ConfigProvider;

    return MockBuilder(ProjectCreationComponent, AppModule)
      .provide({provide: ProjectService, useFactory: () => projectService})
      .mock(TaskDraftService, taskDraftService)
      .provide({provide: CurrentUserService, useFactory: () => currentUserService})
      .provide({provide: Router, useFactory: () => router})
      .provide({provide: MapLayerService, useFactory: () => mapLayerService})
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: ProjectImportService, useFactory: () => projectImportService})
      .provide({provide: ConfigProvider, useFactory: () => configProvider});
  });

  beforeEach(() => {
    fixture = MockRender(ProjectCreationComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add new tasks to map', () => {
    mapLayerService.fitToFeatures = jest.fn();

    const tasks = getDummyTasks();
    // @ts-ignore
    expect(component.vectorSource.getFeatures().length).toEqual(0);

    // @ts-ignore
    component.addTasks(tasks);

    // @ts-ignore
    expect(component.vectorSource.getFeatures().length).toEqual(tasks.length);
    expect(mapLayerService.fitToFeatures).toHaveBeenCalled();
  });

  it('should return tasks correctly', () => {
    const expectedTaskDrafts = [
      new TaskDraft('1', 'one', new Point([1, 2]), 0),
      new TaskDraft('2', 'two', new Point([3, 4]), 10)
    ];
    (taskDraftService.getTasks as jest.Mock).mockReturnValue(expectedTaskDrafts);

    expect(component.taskDrafts).toEqual(expectedTaskDrafts);
  });

  it('should correctly create project', () => {
    const name = 'test name';
    const feature = getDummyFeatures();

    currentUserService.getUserId = jest.fn().mockReturnValue('123');
    projectService.createNewProject = jest.fn().mockReturnValue(of(createProject()));
    router.navigate = jest.fn();

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(projectService.createNewProject).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should not navigate on fail', () => {
    const name = 'test name';

    currentUserService.getUserId = jest.fn().mockReturnValue('123');
    projectService.createNewProject = jest.fn().mockReturnValue(throwError(() => new Error('BOOM')));
    router.navigate = jest.fn();

    const feature = getDummyFeatures();

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(projectService.createNewProject).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not create project with missing user ID', () => {
    const name = 'test name';

    currentUserService.getUserId = jest.fn().mockReturnValue(undefined);
    projectService.createNewProject = jest.fn();
    router.navigate = jest.fn();

    const feature = getDummyFeatures();

    component.createProject(name, 100, 'lorem ipsum', feature);

    expect(projectService.createNewProject).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should add uploaded shape correctly', () => {
    // @ts-ignore
    component.vectorSource.clear = jest.fn();
    // @ts-ignore
    component.vectorSource.addFeatures = jest.fn();
    // @ts-ignore
    mapLayerService.fitToFeatures = jest.fn();

    const tasks = getDummyTasks();
    // @ts-ignore
    component.addTasks(tasks);

    // @ts-ignore
    expect(component.vectorSource.clear).not.toHaveBeenCalled();
    // @ts-ignore
    const featuresArg = (component.vectorSource.addFeatures as jest.Mock).mock.calls[0][0] as Feature<Geometry>[];
    expect(featuresArg[0].getGeometry()).toEqual(tasks[0].geometry);
    expect(featuresArg[1].getGeometry()).toEqual(tasks[1].geometry);
    expect(mapLayerService.fitToFeatures).toHaveBeenCalled();
  });

  it('should create project with all properties', () => {
    const userId = '123';
    const description = 'lorem ipsum';
    const maxProcessPoints = 100;
    const name = 'test project';
    const p = new Polygon([[[0, 0]]]);
    const feature = new Feature(p);

    projectService.createNewProject = jest.fn().mockReturnValue(of({} as Project));
    currentUserService.getUserId = jest.fn().mockReturnValue(userId);

    component.projectProperties.projectDescription = description;
    component.projectProperties.maxProcessPoints = maxProcessPoints;
    component.projectProperties.projectName = name;
    // @ts-ignore
    component.vectorSource.addFeature(feature);

    component.onSaveButtonClicked();

    // @ts-ignore
    expect(projectService.createNewProject).toHaveBeenCalledWith(name, maxProcessPoints, description, expect.anything(), [userId], userId);
  });

  it('should deactivate interactions on tab selection', () => {
    component.onTabSelected();

    // @ts-ignore
    expect(component.drawInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.modifyInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.removeInteraction.getActive()).toEqual(false);
  });

  it('should fire reset subject on tab select', () => {
    const selectionSpy = jest.fn();
    component.resetToolbarSelectionSubject.subscribe(selectionSpy);

    component.onTabSelected();

    expect(selectionSpy).toHaveBeenCalled();
  });

  it('should toggle draw and modify interactions correctly', () => {
    component.onToggleDraw();

    // @ts-ignore
    expect(component.drawInteraction.getActive()).toEqual(true);
    // @ts-ignore
    expect(component.modifyInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.removeInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleDraw();

    expectInteractionsToBeInDefaultState();
  });

  it('should toggle delete interactions correctly', () => {
    component.onToggleDelete();

    // @ts-ignore
    expect(component.drawInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.modifyInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.removeInteraction.getActive()).toEqual(true);
    // @ts-ignore
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleDelete();

    expectInteractionsToBeInDefaultState();
  });

  it('should toggle edit interactions correctly', () => {
    component.onToggleEdit();

    // @ts-ignore
    expect(component.drawInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.modifyInteraction.getActive()).toEqual(true);
    // @ts-ignore
    expect(component.removeInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleEdit();

    expectInteractionsToBeInDefaultState();
  });

  it('should add feature on draw interaction', () => {
    // Arrange
    const newFeature = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    const newTaskDraft = new TaskDraft('1', 'one', newFeature.getGeometry() as Geometry, 123);
    (taskDraftService.toTaskDraft as jest.Mock).mockReturnValue(newTaskDraft);

    // Act
    // @ts-ignore
    component.drawInteraction.dispatchEvent({
      type: 'drawend',
      feature: newFeature,
      target: undefined,
      preventDefault: undefined,
      stopPropagation: undefined
    } as unknown as DrawEvent);

    // Assert
    expect(taskDraftService.addTasks).toHaveBeenCalledWith([newTaskDraft], false);
  });

  it('should remove feature on remove interaction', () => {
    const feature = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    feature.set('id', '123');

    // @ts-ignore
    component.removeInteraction.dispatchEvent({
      type: 'select',
      selected: [feature],
      deselected: [],
      stopPropagation: undefined,
      preventDefault: undefined,
      target: undefined,
      mapBrowserEvent: undefined
    } as unknown as SelectEvent);

    expect(taskDraftService.removeTask).toHaveBeenCalledWith('123');
  });

  it('should select feature on select interaction', () => {
    const feature = new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    feature.set('id', '123');

    // @ts-ignore
    component.selectInteraction.dispatchEvent({
      type: 'select',
      selected: [feature],
      deselected: [],
      stopPropagation: undefined,
      preventDefault: undefined,
      target: undefined,
      mapBrowserEvent: undefined
    } as unknown as SelectEvent);

    expect(taskDraftService.selectTask).toHaveBeenCalledWith('123');
  });

  it('should remove layers on destroy', () => {
    mapLayerService.removeLayer = jest.fn();

    component.ngOnDestroy();

    // @ts-ignore
    expect(mapLayerService.removeLayer).toHaveBeenCalledWith(component.vectorLayer);
    // @ts-ignore
    expect(mapLayerService.removeLayer).toHaveBeenCalledWith(component.previewVectorLayer);
  });

  function expectInteractionsToBeInDefaultState(): void {
    // @ts-ignore
    expect(component.drawInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.modifyInteraction.getActive()).toEqual(false);
    // @ts-ignore
    expect(component.removeInteraction.getActive()).toEqual(false);

    // Selection is enabled when all other interactions aren't
    // @ts-ignore
    expect(component.selectInteraction.getActive()).toEqual(true);
  }

  function createProject(): Project {
    const t = new Task('567', '', 10, 100, TestTaskFeature);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1, true, new Date(), 0, 0);
  }

  function getDummyFeatures(): Feature<Geometry>[] {
    const feature: Feature<Geometry>[] = [];
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
