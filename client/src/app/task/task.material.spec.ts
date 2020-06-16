import { Task, TestTaskFeature } from './task.material';
import { User } from '../user/user.material';

describe('Task', () => {
  it('should create an instance without assigned User', () => {
    expect(new Task('t-0', undefined, 0, 100, TestTaskFeature)).toBeTruthy();
  });
  it('should create an instance', () => {
    expect(new Task('t-0', undefined, 0, 100, TestTaskFeature, new User('peter', '2'))).toBeTruthy();
  });
});
