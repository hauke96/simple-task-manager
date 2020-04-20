import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../project/project.service';
import { Project } from '../project/project.material';
import { ErrorService } from '../common/error.service';

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
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
  }

  public onInvitationButtonClicked() {
    this.projectService.inviteUser(this.userName, this.projectId)
      .subscribe(p => {
      }, err => {
        console.log(err);
        this.errorService.addError('Could not invite user \'' + this.userName + '\'');
      });
  }
}
