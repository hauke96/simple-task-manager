import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../../project/project.service';
import { Project } from '../../project/project.material';
import { CurrentUserService } from '../current-user.service';
import { ErrorService } from '../../common/error.service';
import { User } from '../user.material';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  @Input() project: Project;
  @Input() users: User[];

  constructor(
    private projectService: ProjectService,
    private currentUserService: CurrentUserService,
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
  }

  public onRemoveUserClicked(user: string) {
    this.projectService.removeUser(this.project.id, user)
      .subscribe(() => {
      }, err => {
        console.error(err);
        this.errorService.addError('Could not remove user');
      });
  }

  public canRemove(user: string): boolean {
    return this.project.owner.uid === this.currentUserService.getUserId() && user !== this.currentUserService.getUserId();
  }
}
