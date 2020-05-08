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

    const spyService = spyOn(projectService, 'createNewProject').and.returnValue(of(new Project('123', name, 'lorem ipsum', ['1', '2'], ['user'], 'user')));
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
});
