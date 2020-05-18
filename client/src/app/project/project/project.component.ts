import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { TaskService } from '../../task/task.service';
import { Project } from '../project.material';
import { Task } from '../../task/task.material';
import { CurrentUserService } from '../../user/current-user.service';
import { User } from '../../user/user.material';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  public project: Project;
  public tasks: Task[];
  public users: User[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
    private currentUserService: CurrentUserService
  ) {
  }

  ngOnInit(): void {
    this.project = this.route.snapshot.data.project;
    this.tasks = this.route.snapshot.data.tasks;
    this.users = this.route.snapshot.data.users;
    this.taskService.selectTask(this.tasks[0]);

    this.projectService.projectChanged.subscribe(p => this.project = p);
  }

  public isOwner(): boolean {
    return this.currentUserService.getUserId() === this.project.owner;
  }
}
