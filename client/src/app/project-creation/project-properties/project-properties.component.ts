import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-project-properties',
  templateUrl: './project-properties.component.html',
  styleUrls: ['./project-properties.component.scss']
})
export class ProjectPropertiesComponent {
  @Input() projectProperties: any;

  constructor() {
  }
}
