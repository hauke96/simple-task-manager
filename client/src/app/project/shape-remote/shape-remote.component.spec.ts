import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeRemoteComponent } from './shape-remote.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ShapeRemoteComponent', () => {
  let component: ShapeRemoteComponent;
  let fixture: ComponentFixture<ShapeRemoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShapeRemoteComponent],
      imports: [
        HttpClientTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeRemoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
