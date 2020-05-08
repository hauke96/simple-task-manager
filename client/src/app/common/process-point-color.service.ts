import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProcessPointColorService {

  private fullColorMaxValue = 255;
  private paleColorMaxValue = 127;

  constructor() {
  }

  public getProcessPointsColor(processPoints: number, maxProcessPoints: number): string {
    return this.calcColor(this.fullColorMaxValue, processPoints, maxProcessPoints);
  }

  private calcColor(saturation: number, processPoints: number, maxProcessPoints: number) {
    const rValue = (255 - saturation) + Math.min(saturation, 2 * saturation * (1 - (processPoints / maxProcessPoints)));
    const gValue = (255 - saturation) + Math.min(saturation, 2 * saturation * (processPoints / maxProcessPoints));
    const bValue = 255 - saturation;

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
