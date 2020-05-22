import { Task, TestTaskGeometry } from './task.material';

describe('Task', () => {
  it('should create an instance without assigned User', () => {
    expect(new Task('t-0', 0, 100, TestTaskGeometry)).toBeTruthy();
  });
  it('should create an instance', () => {
    expect(new Task('t-0', 0, 100, TestTaskGeometry, 'peter')).toBeTruthy();
  });
});
