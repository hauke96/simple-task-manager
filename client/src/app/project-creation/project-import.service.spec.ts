import { TestBed } from '@angular/core/testing';

import { ProjectImportService } from './project-import.service';

describe('ProjectImportService', () => {
  let service: ProjectImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
