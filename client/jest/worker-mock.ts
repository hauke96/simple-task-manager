export default class Worker {
  public onmessage: (msg: string) => void;

  constructor(public url: string) {
    this.onmessage = () => {};
  }

  postMessage(msg: string): void {
    this.onmessage(msg);
  }

  addEventListener(event: string, fn: () => void): void {}
}
