import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from './project.service';
import { TaskService } from '../task/task.service';
import { Project } from './project.material';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  public thisProject: Project;

  constructor(private route: ActivatedRoute, private projectService: ProjectService, private taskService: TaskService) { }

  ngOnInit(): void {
    this.projectService.getProject(this.route.snapshot.params.id).subscribe(p => this.thisProject = p);
  }
}
