import { ProjectPropertiesComponent } from './project-properties.component';
import { ProjectProperties } from '../project-properties';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';

describe(ProjectPropertiesComponent.name, () => {
  let component: ProjectPropertiesComponent;
  let fixture: MockedComponentFixture<ProjectPropertiesComponent, any>;

  beforeEach(() => {
    return MockBuilder(ProjectPropertiesComponent);
  });

  beforeEach(() => {
    fixture = MockRender(ProjectPropertiesComponent, {projectProperties: new ProjectProperties('', 100, '')});
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
