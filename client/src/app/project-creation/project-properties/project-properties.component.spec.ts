import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPropertiesComponent } from './project-properties.component';
import { ProjectProperties } from '../project-properties';

describe('ProjectPropertiesComponent', () => {
  let component: ProjectPropertiesComponent;
  let fixture: ComponentFixture<ProjectPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectPropertiesComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectPropertiesComponent);
    component = fixture.componentInstance;
    component.projectProperties = new ProjectProperties('', 100, '');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
