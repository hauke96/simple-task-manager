import { Component, Input } from '@angular/core';
import { ProjectProperties } from '../project-properties';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfigProvider } from '../../config/config.provider';

@Component({
  selector: 'app-project-properties',
  templateUrl: './project-properties.component.html',
  styleUrls: ['./project-properties.component.scss'],
  viewProviders: [{provide: ControlContainer, useExisting: NgForm}]
})
export class ProjectPropertiesComponent {
  @Input() projectProperties: ProjectProperties;

  constructor(public config: ConfigProvider) {
  }
}
