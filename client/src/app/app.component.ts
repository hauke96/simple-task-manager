import { Component } from '@angular/core';
import { ConfigProvider } from './config/config.provider';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private config: ConfigProvider) {
  }

  get isInTestMode(): boolean {
    return this.config.testEnvironment;
  }
}
