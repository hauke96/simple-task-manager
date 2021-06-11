import { TestBed } from '@angular/core/testing';

import { ProjectImportService } from './project-import.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProjectImportService', () => {
  let service: ProjectImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProjectImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
