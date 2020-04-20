import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCreationComponent } from './project-creation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

describe('ProjectCreationComponent', () => {
  let component: ProjectCreationComponent;
  let fixture: ComponentFixture<ProjectCreationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectCreationComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        FormsModule
      ]
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
