import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProcessPointColorService {
  constructor() {
  }

  public getProcessPointsColor(processPoints: number, maxProcessPoints: number): string {
    return this.calcColor(processPoints, maxProcessPoints);
  }

  private calcColor(processPoints: number, maxProcessPoints: number) {
    if (processPoints < 0 || maxProcessPoints <= 0) {
      throw new Error('Input values [' + processPoints + ' / ' + maxProcessPoints + '] out of range');
    }

    const rValue = Math.min(255, 511 * (1 - (processPoints / maxProcessPoints)));
    const gValue = Math.min(255, 511 * (processPoints / maxProcessPoints));
    const bValue = 0;

    let r = Math.round(rValue).toString(16);
    let g = Math.round(gValue).toString(16);
    let b = Math.round(bValue).toString(16);

    if (r.length === 1) {
      r = '0' + r;
    }
    if (g.length === 1) {
      g = '0' + g;
    }
    if (b.length === 1) {
      b = '0' + b;
    }

    return '#' + r + g + b;
  }
}
