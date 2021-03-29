import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyProjectComponent } from './copy-project.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CopyProjectComponent', () => {
  let component: CopyProjectComponent;
  let fixture: ComponentFixture<CopyProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CopyProjectComponent],
      imports: [HttpClientTestingModule]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
