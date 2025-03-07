import { Component, Input, OnInit } from '@angular/core';
import { ProcessPointColorService } from '../../common/services/process-point-color.service';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    standalone: false
})
export class ProgressBarComponent implements OnInit {
  @Input() progressPoints: number;
  @Input() totalPoints: number;

  constructor(
    private processPointColorService: ProcessPointColorService
  ) {
  }

  ngOnInit(): void {
  }

  getProcessPointColor(): string {
    return this.processPointColorService.getProcessPointsColor(this.progressPoints, this.totalPoints);
  }

  getProcessPointWidth(): string {
    return Math.floor(this.progressPoints / this.totalPoints * 100) + 'px';
  }

  getProcessPointPercentage(): number {
    return Math.round(this.progressPoints / this.totalPoints * 100);
  }
}
