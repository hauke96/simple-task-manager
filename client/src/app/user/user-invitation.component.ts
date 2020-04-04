import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-invitation',
  templateUrl: './user-invitation.component.html',
  styleUrls: ['./user-invitation.component.scss']
})
export class UserInvitationComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  public onInvitationButtonClicked(userName: string) {
    console.log(userName + " invited");
    // TODO make server call
  }
}
