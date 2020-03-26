import { Component, OnInit } from '@angular/core';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {
  public userName: string;

  constructor(private loginService: LoginService) { }

  ngOnInit(): void {
  	this.loginService.getUserData((details, err) => {
      this.userName = details.getElementsByTagName('user')[0].getAttribute('display_name');
      console.error(err);
	});
  }
}
