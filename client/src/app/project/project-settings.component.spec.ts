import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsComponent } from './project-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ProjectService } from './project.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

class MockRouter {
  navigate(commands: any[]) { return of(true).toPromise(); }
}

describe('ProjectSettingsComponent', () => {
  let component: ProjectSettingsComponent;
  let fixture: ComponentFixture<ProjectSettingsComponent>;
  let projectService: ProjectService;
  let routerMock: MockRouter;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsComponent ],
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ProjectService,
        {
          provide: Router,
          useClass: MockRouter
        }
      ]
    })
    .compileComponents();

    projectService = TestBed.get(ProjectService);
    routerMock = TestBed.get(Router);
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
    spyOn(routerMock, 'navigate').and.callThrough();
    component.projectId = '1';

    component.onDeleteButtonClicked();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/manager']);
  });

  it('should not navigate on error', () => {
    spyOn(projectService, 'deleteProject').and.callFake((id: string) => {
      expect(id).toEqual('1');
      return throwError('Test-error');
    });
    spyOn(routerMock, 'navigate').and.callThrough();
    component.projectId = '1';

    component.onDeleteButtonClicked();

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
