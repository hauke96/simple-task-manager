import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCreationComponent } from './project-creation.component';

describe('ProjectCreationComponent', () => {
  let component: ProjectCreationComponent;
  let fixture: ComponentFixture<ProjectCreationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectCreationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
