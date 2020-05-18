import { Component, Input, OnInit } from '@angular/core';
import { ProjectService } from '../../project/project.service';
import { Project } from '../../project/project.material';
import { UserService } from '../user.service';
import { ErrorService } from '../../common/error.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  @Input() project: Project;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private errorService: ErrorService
  ) {
  }

  public canRemove(user: string): boolean {
    return this.project.owner === this.userService.getUserId() && user !== this.userService.getUserId();
  }

  ngOnInit(): void {
    // When e.g. a user has been added
    this.projectService.projectChanged.subscribe(p => this.project = p);
  }

  onRemoveUserClicked(user: string) {
    this.projectService.removeUser(this.project.id, user)
      .subscribe(() => {
      }, err => {
        console.error(err);
        this.errorService.addError('Could not remove user');
      });
  }
}
