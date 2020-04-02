import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
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
  ) { }

  ngOnInit(): void {
    this.projectService.getProject(this.route.snapshot.params.id)
      .subscribe(p => {
        this.taskService.getTasks(p.taskIds).subscribe(t => {
          this.tasks = t;
          this.thisProject = p;
          this.taskService.selectTask(t[0]);
        }, e => {
          console.error(e);
          this.router.navigate(['/manager']);
        });
      }, e => {
        console.error(e);
        this.router.navigate(['/manager']);
      });
  }
}
