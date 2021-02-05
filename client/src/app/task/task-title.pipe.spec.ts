import { TaskTitlePipe } from './task-title.pipe';
import { Task } from './task.material';

describe('TaskNamePipe', () => {
  let pipe: TaskTitlePipe;

  beforeEach(() => {
    pipe = new TaskTitlePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string on falsy value', () => {
    expect(pipe.transform(undefined)).toEqual('');
    expect(pipe.transform(null)).toEqual('');
  });

  it('should return correct title', () => {
    expect(pipe.transform(new Task('123', undefined, undefined, undefined, undefined))).toEqual('123');
    expect(pipe.transform(new Task(undefined, 'bar', undefined, undefined, undefined))).toEqual('bar');
    expect(pipe.transform(new Task('234', 'foo', undefined, undefined, undefined))).toEqual('foo');
  });
});
