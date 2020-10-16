import { Component, Input, OnInit } from '@angular/core';
import { Feature } from 'ol';

@Component({
  selector: 'app-task-draft-list',
  templateUrl: './task-draft-list.component.html',
  styleUrls: ['./task-draft-list.component.scss']
})
export class TaskDraftListComponent {
  @Input() public taskDrafts: any[];
  @Input() public selectedPolygon: Feature;

  constructor() { }
}
