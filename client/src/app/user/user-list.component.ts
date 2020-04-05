import { Component, OnInit, Input } from '@angular/core';
import { ProjectService } from '../project/project.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  @Input() users: string[];

  constructor(
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    this.projectService.projectChanged.subscribe(p => this.users = p.users);
  }
}
