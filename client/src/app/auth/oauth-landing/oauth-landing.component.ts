import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-oauth-landing',
  templateUrl: './oauth-landing.component.html',
  styleUrls: ['./oauth-landing.component.scss']
})
export class OauthLandingComponent implements OnInit {
  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      localStorage.setItem('auth_token', params.token);
      window.close();
    });
  }

  ngOnInit(): void {
  }
}
