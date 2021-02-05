import { Task, TestTaskFeature } from './task.material';
import { User } from '../user/user.material';

describe('Task', () => {
  it('should create an instance without assigned User', () => {
    expect(new Task('t-0', undefined, 0, 100, TestTaskFeature)).toBeTruthy();
  });

  it('should create an instance', () => {
    expect(new Task('t-0', undefined, 0, 100, TestTaskFeature, new User('peter', '2'))).toBeTruthy();
  });

  it('should determine done state correctly', () => {
    expect(new Task('t-0', undefined, 0, 100, TestTaskFeature, new User('peter', '2')).isDone).toBeFalse();
    expect(new Task('t-1', undefined, 50, 100, TestTaskFeature, new User('peter', '2')).isDone).toBeFalse();
    expect(new Task('t-2', undefined, 99, 100, TestTaskFeature, new User('peter', '2')).isDone).toBeFalse();
    expect(new Task('t-3', undefined, 100, 100, TestTaskFeature, new User('peter', '2')).isDone).toBeTrue();
  });
});
