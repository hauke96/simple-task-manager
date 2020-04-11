import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsComponent } from './project-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ProjectService } from './project.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let projectService: ProjectService;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        ProjectService
      ]
    })
    .compileComponents();

    projectService = TestBed.get(ProjectService);

    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should make service call', () => {
    spyOn(projectService, 'deleteProject').and.callFake((id: string) => {
      expect(id).toEqual('1');
      return of({});
    });
    spyOn(router, 'navigate').and.callFake((commands: any[]) => {
      expect(commands[0]).toEqual('/manager');
      return of(true).toPromise();
    });
    component.projectId = '1';

    component.onDeleteButtonClicked();
  });

  it('should not navigate on error', () => {
    spyOn(projectService, 'deleteProject').and.callFake((id: string) => {
      expect(id).toEqual('1');
      return throwError('Test-error');
    });
    component.projectId = '1';

    component.onDeleteButtonClicked();

    expect(spyOn(router, 'navigate')).not.toHaveBeenCalled();
  });
});
