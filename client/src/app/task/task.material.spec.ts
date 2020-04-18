import { Task } from './task.material';

describe('Task', () => {
  it('should create an instance without assigned User', () => {
    expect(new Task('t-0', 0, 100, [[0, 0], [1, 1], [2, 2]])).toBeTruthy();
  });
  it('should create an instance', () => {
    expect(new Task('t-0', 0, 100, [[0, 0], [1, 1], [2, 2]], 'peter')).toBeTruthy();
  });
});
