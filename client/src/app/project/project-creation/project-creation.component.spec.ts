import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCreationComponent } from './project-creation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Polygon } from 'ol/geom';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { Project } from '../project.material';
import { Feature } from 'ol';
import { MockRouter } from '../../common/mock-router';
import { Task } from '../../task/task.material';
import { User } from '../../user/user.material';

describe('ProjectCreationComponent', () => {
  let component: ProjectCreationComponent;
  let fixture: ComponentFixture<ProjectCreationComponent>;
  let projectService: ProjectService;
  let routerMock: MockRouter;

  beforeEach(async(() => {
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

    const polygons: Polygon[] = [];
    polygons.push(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    polygons.push(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]]));

    component.createProject(name, 100, 'lorem ipsum', polygons);

    expect(spyService).toHaveBeenCalled();
    expect(spyRouter).toHaveBeenCalledWith(['/manager']);
  });

  it('should not navigate on fail', () => {
    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(throwError('BOOM'));
    const spyRouter = spyOn(routerMock, 'navigate').and.callThrough();

    const polygons: Polygon[] = [];
    polygons.push(new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
    polygons.push(new Polygon([[[4000, 4000], [5000, 6000], [6000, 4000], [4000, 4000]]]));

    component.createProject(name, 100, 'lorem ipsum', polygons);

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

    component.onShapesCreated(features);

    expect(spySource).toHaveBeenCalledTimes(2);
  });

  it('should add uploaded shape correctly', () => {
    const vectorSourceClearSpy = spyOn(component.vectorSource, 'clear').and.callThrough();
    const vectorSourceAddSpy = spyOn(component.vectorSource, 'addFeature').and.callThrough();

    const feature = new Feature(new Polygon([[[0, 0]]]));
    component.onShapesUploaded([feature]);

    expect(vectorSourceClearSpy).toHaveBeenCalled();
    expect(vectorSourceAddSpy).toHaveBeenCalledWith(feature);
  });

  it('should set interaction for "Draw" tab', () => {
    component.onTabSelected(0);

    expect(component.drawInteraction.getActive()).toEqual(true);
    expect(component.modifyInteraction.getActive()).toEqual(true);
    expect(component.selectInteraction.getActive()).toEqual(false);
  });

  it('should set interaction for "Upload" tab', () => {
    component.onTabSelected(1);

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(true);
    expect(component.selectInteraction.getActive()).toEqual(false);
  });

  it('should set interaction for "Delete" tab', () => {
    component.onTabSelected(2);

    expect(component.drawInteraction.getActive()).toEqual(false);
    expect(component.modifyInteraction.getActive()).toEqual(false);
    expect(component.selectInteraction.getActive()).toEqual(true);
  });

  it('should error on unknown tab', () => {
    expect(() => component.onTabSelected(85746)).toThrow();
  });

  it('should create project with all properties', () => {
    const saveSpy = spyOn(component, 'createProject').and.callFake(() => {
    });

    const description = 'lorem ipsum';
    const maxProcessPoints = 100;
    const name = 'test project';
    let p = new Polygon([[[0, 0]]]);
    const feature = new Feature(p);

    component.projectDescription = description;
    component.newMaxProcessPoints = maxProcessPoints;
    component.newProjectName = name;
    component.vectorSource.addFeature(feature);

    component.onSaveButtonClicked();

    expect(saveSpy).toHaveBeenCalledWith(name, maxProcessPoints, description, jasmine.anything());
  });

  function createProject() {
    const t = new Task('567', 10, 100, [[0, 0], [1, 1], [1, 0], [0, 0]]);
    const u1 = new User('test-user', '123');
    const u2 = new User('test-user2', '234');
    const u3 = new User('test-user3', '345');
    return new Project('1', 'test project', 'lorem ipsum', [t], [u1, u2, u3], u1);
  }
});
