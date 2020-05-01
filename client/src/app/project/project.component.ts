import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from './project.service';
import { TaskService } from '../task/task.service';
import { Project } from './project.material';
import { Task } from '../task/task.material';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  public project: Project;
  public tasks: Task[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService
  ) {
  }

  ngOnInit(): void {
    this.project = this.route.snapshot.data.project;
    this.tasks = this.route.snapshot.data.tasks;
    this.taskService.selectTask(this.tasks[0]);

    this.projectService.projectChanged.subscribe(p => this.project = p);
  }

  isOwner(): boolean {
    return this.userService.getUser() === this.project.owner;
  }
}
