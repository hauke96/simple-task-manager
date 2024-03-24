import { Task, TestTaskFeature } from './task.material';
import { User } from '../user/user.material';

describe(Task.name, () => {
  it('should create an instance without assigned User', () => {
    expect(new Task('t-0', '', 0, 100, TestTaskFeature, [])).toBeTruthy();
  });

  it('should create an instance', () => {
    expect(new Task('t-0', '', 0, 100, TestTaskFeature, [], new User('peter', '2'))).toBeTruthy();
  });

  it('should determine done state correctly', () => {
    expect(new Task('t-0', '', 0, 100, TestTaskFeature, [], new User('peter', '2')).isDone).toEqual(false);
    expect(new Task('t-1', '', 50, 100, TestTaskFeature, [], new User('peter', '2')).isDone).toEqual(false);
    expect(new Task('t-2', '', 99, 100, TestTaskFeature, [], new User('peter', '2')).isDone).toEqual(false);
    expect(new Task('t-3', '', 100, 100, TestTaskFeature, [], new User('peter', '2')).isDone).toEqual(true);
  });
});
