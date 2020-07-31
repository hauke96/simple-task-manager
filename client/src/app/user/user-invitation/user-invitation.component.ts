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
  @Input() public users: User[];
  @Output() public userInvited: EventEmitter<User> = new EventEmitter<User>();

  public enteredUserName: string;

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit(): void {
  }

  public onInvitationButtonClicked() {
    if (this.users.map(u => u.name).includes(this.enteredUserName)) {
      this.notificationService.addWarning($localize`:@@WARN_ALREADY_MEMBER:User '${ this.enteredUserName }:INTERPOLATION:' is already a member of this project`);
      return;
    }

    this.userService.getUserByName(this.enteredUserName).subscribe(
      user => {
        this.userInvited.emit(user);
      }, err => {
        console.error(err);
        this.notificationService.addError($localize`:@@ERROR_USER_ID:Could not load user ID for user '${this.enteredUserName}:INTERPOLATION:'`);
      });
  }
}
