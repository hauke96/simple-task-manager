import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../project/project.material';

@Component({
  selector: 'app-copy-project',
  templateUrl: './copy-project.component.html',
  styleUrls: ['./copy-project.component.scss']
})
export class CopyProjectComponent implements OnInit {
  @Input() projects: Project[];

  constructor() {
  }

  ngOnInit(): void {
  }

}
