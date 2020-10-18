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

  it('should return tasks correctly', () => {
    const features = getDummyFeatures();
    component.vectorSource.addFeatures(features);

    expect(component.taskFeatures).toEqual(features);
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
    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(throwError('BOOM'));
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    const feature = getDummyFeatures();

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
    component.onShapesCreated([feature]);

    expect(vectorSourceClearSpy).not.toHaveBeenCalled();
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

    allInteractionsOnDefaultState();
  });

  it('should toggle delete interactions correctly', () => {
    component.onToggleDelete();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.removeInteraction.getActive()).toEqual(true);
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleDelete();

    allInteractionsOnDefaultState();
  });

  it('should toggle edit interactions correctly', () => {
    component.onToggleEdit();

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(true);
    expect(component.removeInteraction.getActive()).toEqual(false);
    expect(component.selectInteraction.getActive()).toEqual(false);

    component.onToggleEdit();

    allInteractionsOnDefaultState();
  });

  it('should handle divided shape correctly', () => {
    // @ts-ignore
    const spyView = spyOn(component.map.getView(), 'fit');
    component.selectedPolygon = new Feature();
    component.selectedPolygon.setGeometry(new Polygon([[[0, 0], [2, 0], [1, 1]]]));
    component.vectorSource.addFeature(component.selectedPolygon);

    const features = getDummyFeatures();

    component.onSelectedShapeSubdivided(features);

    expect(component.vectorSource.getFeatures().length).toEqual(2);
    expect(component.vectorSource.getFeatures()).toContain(features[0]);
    expect(component.vectorSource.getFeatures()).toContain(features[1]);
    expect(spyView).not.toHaveBeenCalled();
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
    const features = getDummyFeatures();
    component.vectorSource.addFeatures(features);
    expect(component.vectorSource.getFeatures().length).toEqual(2);

    component.removeInteraction.dispatchEvent({
      type: 'select',
      selected: [features[0]],
      deselected: []
    } as SelectEvent);

    expect(component.vectorSource.getFeatures().length).toEqual(1);
    expect(component.vectorSource.getFeatures()[0]).toEqual(features[1]);
  });

  it('should select feature on select interaction', () => {
    const features = getDummyFeatures();
    expect(component.selectedPolygon).toBeUndefined();

    component.selectInteraction.dispatchEvent({
      type: 'select',
      selected: [features[0]],
      deselected: []
    } as SelectEvent);

    expect(component.selectedPolygon).toEqual(features[0]);
  });

  it('should add feature IDs correctly', () => {
    const features: Feature[] = [];
    features.push(createFeatureById({id: 10}));
    features.push(createFeatureById({id: '5'}));
    features.push(createFeatureById({id: 'one'}));
    features.push(createFeatureById({id: '   '}));
    features.push(createFeatureById({id: null}));
    features.push(createFeatureById({id: undefined}));
    features.push(createFeatureById());
    features.push(createFeatureById({id: 0}));
    features.push(createFeatureById({id: -1}));
    features.push(createFeatureById({id: 5.123}));
    features.push(createFeatureById({id: false}));
    features.push(createFeatureById({id: true}));
    features.push(createFeatureById({id: []}));
    features.push(createFeatureById({id: {}}));

    component.onShapesCreated(features);

    const addedShapes = component.vectorSource.getFeatures();
    expect(addedShapes.length).toEqual(features.length);
    expect(addedShapes.map(f => f.get('id'))).toContain('10');
    expect(addedShapes.map(f => f.get('id'))).toContain('5');
    expect(addedShapes.map(f => f.get('id'))).toContain('1'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('2'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('3'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('4'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('6'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('0');
    expect(addedShapes.map(f => f.get('id'))).toContain('7'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('8'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('9'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('11'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('12'); // generated ID
    expect(addedShapes.map(f => f.get('id'))).toContain('13'); // generated ID
  });

  it('should add feature name correctly', () => {
    const features: Feature[] = [];
    features.push(createFeatureById({id: 0}));
    features.push(createFeatureById({id: 1, name: ''}));
    features.push(createFeatureById({id: 2, name: undefined}));
    features.push(createFeatureById({id: 3, name: null}));
    features.push(createFeatureById({id: 4, name: 'foo'}));

    component.onShapesCreated(features);

    const addedShapes = component.vectorSource.getFeatures();
    expect(addedShapes.length).toEqual(features.length);
    expect(addedShapes[0].get('name')).toContain('0');
    expect(addedShapes[1].get('name')).toContain('1');
    expect(addedShapes[2].get('name')).toContain('2');
    expect(addedShapes[3].get('name')).toContain('3');
    expect(addedShapes[4].get('name')).toContain('foo');
  });

  it('should determine smallest ID correctly', () => {
    const features: Feature[] = [];
    features.push(new Feature({id: 10}));
    features.push(new Feature({id: -1}));
    features.push(new Feature({id: 0}));
    features.push(new Feature({id: '5'}));
    features.push(new Feature({id: 1}));
    features.push(new Feature({id: 3}));

    const smallestId = component.findSmallestId(features);

    expect(smallestId).toEqual('2');
  });

  it('should sort features correctly', () => {
    const features: Feature[] = [];
    features.push(new Feature({id: 10}));
    features.push(new Feature({id: '5'}));
    features.push(new Feature({id: 'one'}));
    features.push(new Feature({id: '   '}));
    features.push(new Feature({id: null}));
    features.push(new Feature({id: undefined}));
    features.push(new Feature());
    features.push(new Feature({id: 0}));
    features.push(new Feature({id: -1}));
    features.push(new Feature({id: 5.123}));
    features.push(new Feature({id: false}));
    features.push(new Feature({id: true}));
    features.push(new Feature({id: []}));
    features.push(new Feature({id: {}}));

    const sortedFeatures = component.sortFeaturesById(features);

    expect(sortedFeatures.length).toEqual(3);
    expect(sortedFeatures[0]).toEqual(features[7]);
    expect(sortedFeatures[1]).toEqual(features[1]);
    expect(sortedFeatures[2]).toEqual(features[0]);
  });

  function createFeatureById(props?: any): Feature {
    const f = new Feature(props);
    f.setGeometry(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    return f;
  }

  function allInteractionsOnDefaultState() {
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
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }

  function getDummyFeatures() {
    const feature: Feature[] = [];
    feature.push(new Feature(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]])));
    feature.push(new Feature(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]])));
    return feature;
  }
});
