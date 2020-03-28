export class Task {
  constructor(public id: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: [[number, number]],
    public assignedUser?: string) { }
}
