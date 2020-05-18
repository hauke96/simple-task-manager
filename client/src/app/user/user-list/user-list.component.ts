import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../../project/project.service';
import { Project } from '../../project/project.material';
import { CurrentUserService } from '../current-user.service';
import { ErrorService } from '../../common/error.service';
import { User } from '../user.material';
import { UserService } from '../user.service';

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
    private userService: UserService,
    private errorService: ErrorService
  ) {
  }

  ngOnInit(): void {
    // When e.g. a user has been added
    this.projectService.projectChanged.subscribe(p => {
      this.project = p;
      this.updateUsers();
    });
  }

  private updateUsers() {
    if (!this.project) {
      this.users = [];
      return;
    }

    this.userService.getUsersFromIds(this.project.users).subscribe(
      (users: User[]) => {
        this.users = users;
      },
      e => {
        console.error(e);
        this.errorService.addError('Unable to update users');
      }
    );
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
    return this.project.owner === this.currentUserService.getUserId() && user !== this.currentUserService.getUserId();
  }
}
