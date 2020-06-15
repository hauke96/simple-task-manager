import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeRemoteComponent } from './shape-remote.component';

describe('ShapeRemoteComponent', () => {
  let component: ShapeRemoteComponent;
  let fixture: ComponentFixture<ShapeRemoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeRemoteComponent ]
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
