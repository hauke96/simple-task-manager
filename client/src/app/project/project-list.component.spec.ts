import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../user/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MockRouter } from '../common/mock-router';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let routerMock: MockRouter;
  let userService: UserService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectListComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        UserService,
        {
          provide: Router,
          useClass: MockRouter
        },
        {
          provide: ActivatedRoute,
          useValue: {snapshot: {data: {projects: []}}}
        }
      ]
    })
      .compileComponents();

    routerMock = TestBed.inject(Router);
    userService = TestBed.inject(UserService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate on click', () => {
    const spy = spyOn(routerMock, 'navigate');

    component.onProjectListItemClicked('123');

    expect(spy).toHaveBeenCalledWith(['/project', '123']);
  });

  it('should get current user correctly', () => {
    spyOn(userService, 'getUser').and.returnValue('test-user');

    expect(component.currentUser).toEqual('test-user');
  });
});
