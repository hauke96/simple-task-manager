import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInvitationComponent } from './user-invitation.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('UserInvitationComponent', () => {
  let component: UserInvitationComponent;
  let fixture: ComponentFixture<UserInvitationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserInvitationComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule
      ]
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
