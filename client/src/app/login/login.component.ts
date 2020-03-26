import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  constructor(private router: Router, private loginService: LoginService) { }

  ngOnInit(): void {
  }

  public onLoginButtonClick() : void {
  	this.loginService.requestLogin(() => this.router.navigate(['/manager']));
  }
}
