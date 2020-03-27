import { Component, OnInit } from '@angular/core';
import { ProjectService } from './project.service';
import { TaskService } from './../task/task.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  constructor(private projectService: ProjectService, private taskService: TaskService, private router: Router) { }

  public get projects() {
    return this.projectService.getProjects();
  }

  ngOnInit(): void {
  }

  public onProjectListItemClicked(id: string) {
    // Select the first task. Otherwise no task or an old task would be selected and shown.
    const project = this.projectService.getProject(id);
    this.taskService.selectTask(project.taskIds[0]);

    this.router.navigate(['/project', id]);
  }
}
