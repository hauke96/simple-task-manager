import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NotificationService } from '../../common/services/notification.service';
import { UserService } from '../user.service';
import { User } from '../user.material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-invitation',
  templateUrl: './user-invitation.component.html',
  styleUrls: ['./user-invitation.component.scss']
})
export class UserInvitationComponent {
  @Input() public users: User[];
  @Output() public userInvited: EventEmitter<User> = new EventEmitter<User>();

  public enteredUserName: string;

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private translationService: TranslateService
  ) {
  }

  public onInvitationButtonClicked(): void {
    if (this.users.map(u => u.name).includes(this.enteredUserName)) {
      this.notificationService.addWarning(this.translationService.instant('user.already-member', {user: this.enteredUserName}));
      return;
    }

    this.userService.getUserByName(this.enteredUserName).subscribe(
      user => {
        this.userInvited.emit(user);
      }, err => {
        console.error(err);
        this.notificationService.addError(this.translationService.instant('user.unable-load-user', {user: this.enteredUserName}));
      });
  }
}
