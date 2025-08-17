import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import packageInfo from '../../../../package.json';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class FooterComponent implements OnInit {
  public version: string = packageInfo.version;

  constructor() {
  }

  ngOnInit(): void {
  }
}
