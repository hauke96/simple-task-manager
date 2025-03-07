import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CurrentUserService } from '../current-user.service';
import { User } from '../user.material';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    standalone: false
})
export class UserListComponent implements OnInit {
  @Input() public users: User[];
  @Input() public ownerUid: string;

  @Output() public userRemoved: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private currentUserService: CurrentUserService
  ) {
  }

  ngOnInit(): void {
  }

  public onRemoveUserClicked(user: string) {
    this.userRemoved.emit(user);
  }

  public canRemove(user: string): boolean {
    return this.ownerUid === this.currentUserService.getUserId() && user !== this.currentUserService.getUserId();
  }
}
