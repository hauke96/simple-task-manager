import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NotificationService } from '../../common/notification.service';
import { UserService } from '../user.service';
import { User } from '../user.material';

@Component({
  selector: 'app-user-invitation',
  templateUrl: './user-invitation.component.html',
  styleUrls: ['./user-invitation.component.scss']
})
export class UserInvitationComponent implements OnInit {
  @Output() public userInvited: EventEmitter<User> = new EventEmitter<User>();

  public userName: string;

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit(): void {
  }

  public onInvitationButtonClicked() {
    this.userService.getUserByName(this.userName).subscribe(
      user => {
        this.userInvited.emit(user);
      }, err => {
        console.error(err);
        this.notificationService.addError('Could not load user ID for user \'' + this.userName + '\'');
      });
  }
}
