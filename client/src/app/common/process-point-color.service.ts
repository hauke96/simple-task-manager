import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProcessPointColorService {
  constructor() {
  }

  public getProcessPointsColor(processPoints: number, maxProcessPoints: number): string {
    if (processPoints < 0 || maxProcessPoints <= 0) {
      throw new Error('Input values [' + processPoints + ' / ' + maxProcessPoints + '] out of range');
    }

    const processPointRatio = processPoints / maxProcessPoints;

    // This makes red a bit lighter than green: Reduce color value the more points the task has
    const maxChannelValue = 230 - 40 * processPointRatio;

    const rValue = Math.min(maxChannelValue, maxChannelValue * 2 * (1 - processPointRatio));
    const gValue = Math.min(maxChannelValue, maxChannelValue * 2 * processPointRatio);
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
