import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectImportComponent } from './project-import.component';
import { ProjectImportService } from '../project-import.service';
import { NotificationService } from '../../common/notification.service';

describe('ProjectImportComponent', () => {
  let component: ProjectImportComponent;
  let fixture: ComponentFixture<ProjectImportComponent>;
  let notificationService: NotificationService;
  let projectImportService: ProjectImportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectImportComponent ]
    })
    .compileComponents();

    notificationService = TestBed.inject(NotificationService);
    projectImportService = TestBed.inject(ProjectImportService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call service on added project export', () => {
    const spy = spyOn(projectImportService, 'importProject');

    component.addProjectExport({target: {result: exampleProjectExport}});

    expect(spy).toHaveBeenCalled();
  });
});

const exampleProjectExport = '{"name":"Mein Projekt","users":["9694","9983"],"owner":"9694","description":"Eine ganz tolle Beschreibung :D","creationDate":"2021-03-09T21:30:16.713505Z","tasks":[{"name":"7","processPoints":0,"maxProcessPoints":10,"geometry":"{\\"type\\":\\"Feature\\",\\"geometry\\":{\\"type\\":\\"Polygon\\",\\"coordinates\\":[[[9.947937276934205,53.559958160065776],[9.94930833197555,53.560256239328254],[9.94708280485028,53.562783348686565],[9.945702618924154,53.56242250391156],[9.947937276934205,53.559958160065776]]]},\\"properties\\":{\\"id\\":\\"7\\",\\"name\\":\\"7\\"}}","assignedUser":""}]}';
