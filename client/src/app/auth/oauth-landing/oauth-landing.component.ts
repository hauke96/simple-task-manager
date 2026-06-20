import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-oauth-landing',
    templateUrl: './oauth-landing.component.html',
    styleUrls: ['./oauth-landing.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OauthLandingComponent {
  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      localStorage.setItem('auth_token', params.token);
      window.close();
    });
  }
}
