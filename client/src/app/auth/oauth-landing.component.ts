import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-oauth-landing',
  templateUrl: './oauth-landing.component.html',
  styleUrls: ['./oauth-landing.component.scss']
})
export class OauthLandingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    window.opener.authComplete(window.location.href);
    window.close();
  }
}
