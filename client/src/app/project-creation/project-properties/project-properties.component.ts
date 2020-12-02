import { Component, Input } from '@angular/core';
import { ProjectProperties } from '../project-properties';

@Component({
  selector: 'app-project-properties',
  templateUrl: './project-properties.component.html',
  styleUrls: ['./project-properties.component.scss']
})
export class ProjectPropertiesComponent {
  @Input() projectProperties: ProjectProperties;

  constructor() {
  }
}
