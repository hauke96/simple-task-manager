import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from './project.service';
import { TaskService } from '../task/task.service';
import { Project } from './project.material';
import { Task } from '../task/task.material';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  public thisProject: Project;
  public tasks: Task[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {
  }

  ngOnInit(): void {
    console.log(JSON.stringify(this.route.snapshot.data));
    this.thisProject = this.route.snapshot.data.project;
    this.tasks = this.route.snapshot.data.tasks;
    this.taskService.selectTask(this.tasks[0]);
  }
}
