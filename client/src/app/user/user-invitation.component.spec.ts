import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInvitationComponent } from './user-invitation.component';

describe('UserInvitationComponent', () => {
  let component: UserInvitationComponent;
  let fixture: ComponentFixture<UserInvitationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserInvitationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
