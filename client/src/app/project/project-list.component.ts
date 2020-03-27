import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  public projects: string[] = [];

  constructor() {
    this.projects[0] = 'Test';
    this.projects[1] = 'foo';
    this.projects[2] = 'bar';
  }

  ngOnInit(): void {
  }
}
