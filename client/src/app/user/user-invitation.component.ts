import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../project/project.service';
import { Project } from '../project/project.material';

@Component({
  selector: 'app-user-invitation',
  templateUrl: './user-invitation.component.html',
  styleUrls: ['./user-invitation.component.scss']
})
export class UserInvitationComponent implements OnInit {
  @Input() project: Project;

  constructor(
    private projectService: ProjectService
  ) {
  }

  ngOnInit(): void {
  }

  public onInvitationButtonClicked(userName: string) {
    this.projectService.inviteUser(userName, this.project.id)
      .subscribe(p => {
        this.project = p;
      });
  }
}
