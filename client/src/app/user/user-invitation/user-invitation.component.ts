import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../../project/project.service';
import { ErrorService } from '../../common/error.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-invitation',
  templateUrl: './user-invitation.component.html',
  styleUrls: ['./user-invitation.component.scss']
})
export class UserInvitationComponent implements OnInit {
  @Input() public projectId: string;
  public userName: string;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
  }

  public onInvitationButtonClicked() {
    this.userService.getUserByName(this.userName).subscribe(
      user => {
        this.projectService.inviteUser(this.projectId, user.uid)
          .subscribe(p => {
          }, err => {
            console.error(err);
            this.errorService.addError('Could not invite user \'' + this.userName + '\'');
          });
      }, err => {
        console.error(err);
        this.errorService.addError('Could not load user ID for user \'' + this.userName + '\'');
      });
  }
}
