import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabsComponent } from './tabs.component';

describe('TabsComponent', () => {
  let component: TabsComponent;
  let fixture: ComponentFixture<TabsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TabsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsComponent);
    component = fixture.componentInstance;

    component.tabs = ['Tasks', 'Users'];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select tab correctly', () => {
    const eventSpy = spyOn(component.tabSelected, 'emit').and.callThrough();
    component.tabs = ['tab1', 'tab2'];

    component.onTabClicked('tab1');
    expect(eventSpy).toHaveBeenCalledWith(0);

    component.onTabClicked('tab2');
    expect(eventSpy).toHaveBeenCalledWith(1);
  });
});
