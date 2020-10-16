import { Component, Input, OnInit } from '@angular/core';
import { Feature } from 'ol';

@Component({
  selector: 'app-task-draft-list',
  templateUrl: './task-draft-list.component.html',
  styleUrls: ['./task-draft-list.component.scss']
})
export class TaskDraftListComponent {
  @Input() public features: Feature[];
  @Input() public selectedPolygon: Feature;

  constructor() { }

  public get taskDrafts(): any[] {
    return this.features?.map(f => ({
      id: f.get('id'),
      name: !!f.get('name') ? f.get('name') : f.get('id')
    }));
  }
}
