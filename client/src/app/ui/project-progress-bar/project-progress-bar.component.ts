import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../project/project.material';
import { ProcessPointColorService } from '../../common/process-point-color.service';

@Component({
  selector: 'app-project-progress-bar',
  templateUrl: './project-progress-bar.component.html',
  styleUrls: ['./project-progress-bar.component.scss']
})
export class ProjectProgressBarComponent implements OnInit {
  @Input() progressPoints: number;
  @Input() totalPoints: number;

  constructor(
    private processPointColorService: ProcessPointColorService
  ) { }

  ngOnInit(): void {
  }

  getProcessPointColor() {
    return this.processPointColorService.getProcessPointsColor(this.progressPoints, this.totalPoints);
  }

  getProcessPointWidth(): string {
    return Math.floor(this.progressPoints / this.totalPoints * 100) + 'px';
  }
}
