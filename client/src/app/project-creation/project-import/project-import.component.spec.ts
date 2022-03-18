import { ProjectImportComponent } from './project-import.component';
import { ProjectImportService } from '../project-import.service';
import { NotificationService } from '../../common/services/notification.service';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';

describe(ProjectImportComponent.name, () => {
  let component: ProjectImportComponent;
  let fixture: MockedComponentFixture<ProjectImportComponent>;
  let notificationService: NotificationService;
  let projectImportService: ProjectImportService;

  beforeEach(() => {
    notificationService = {} as NotificationService;
    projectImportService = {} as ProjectImportService;

    return MockBuilder(ProjectImportComponent, AppModule)
      .provide({provide: NotificationService, useFactory: () => notificationService})
      .provide({provide: ProjectImportService, useFactory: () => projectImportService});
  });

  beforeEach(() => {
    fixture = MockRender(ProjectImportComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on added project export', () => {
    projectImportService.importProjectAsNewProject = jest.fn();

    // @ts-ignore
    component.addProjectExport({target: {result: exampleProjectExport}});

    expect(projectImportService.importProjectAsNewProject).toHaveBeenCalled();
  });
});

const exampleProjectExport = '{"name":"Mein Projekt","users":["9694","9983"],"owner":"9694","description":"Eine ganz tolle Beschreibung :D","creationDate":"2021-03-09T21:30:16.713505Z","tasks":[{"name":"7","processPoints":0,"maxProcessPoints":10,"geometry":"{\\"type\\":\\"Feature\\",\\"geometry\\":{\\"type\\":\\"Polygon\\",\\"coordinates\\":[[[9.947937276934205,53.559958160065776],[9.94930833197555,53.560256239328254],[9.94708280485028,53.562783348686565],[9.945702618924154,53.56242250391156],[9.947937276934205,53.559958160065776]]]},\\"properties\\":{\\"id\\":\\"7\\",\\"name\\":\\"7\\"}}","assignedUser":""}]}';
