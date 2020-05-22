export class Task {
  constructor(
    public id: string,
    public processPoints: number,
    public maxProcessPoints: number,
    public geometry: string,
    public assignedUser?: string,
    public assignedUserName?: string
  ) {
  }
}
