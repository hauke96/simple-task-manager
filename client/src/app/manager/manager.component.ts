import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {
  public userName: string;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  	this.authService.getUserData((details, err) => {
      this.userName = details.getElementsByTagName('user')[0].getAttribute('display_name');
      console.error(err);
	});
  }
}
