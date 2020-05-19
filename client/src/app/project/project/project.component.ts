import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { TaskService } from '../../task/task.service';
import { Project } from '../project.material';
import { CurrentUserService } from '../../user/current-user.service';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  public project: Project;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskService,
    private currentUserService: CurrentUserService,
  ) {
  }

  ngOnInit(): void {
    this.project = this.route.snapshot.data.project;
    this.taskService.selectTask(this.project.tasks[0]);

    this.projectService.projectChanged.subscribe(p => {
      this.project = p;
    });
  }

  public isOwner(): boolean {
    return this.currentUserService.getUserId() === this.project.owner.uid;
  }
}
