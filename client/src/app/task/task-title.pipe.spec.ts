import { TaskTitlePipe } from './task-title.pipe';
import { Task } from './task.material';
import { Feature } from 'ol';

describe('TaskNamePipe', () => {
  let pipe: TaskTitlePipe;

  beforeEach(() => {
    pipe = new TaskTitlePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string on falsy value', () => {
    // @ts-ignore
    expect(pipe.transform(undefined)).toEqual('');
    // @ts-ignore
    expect(pipe.transform(null)).toEqual('');
  });

  it('should return correct title', () => {
    expect(pipe.transform(new Task('123', '', 0, 0, new Feature()))).toEqual('123');
    // @ts-ignore
    expect(pipe.transform(new Task(undefined, 'bar', 0, 0, new Feature()))).toEqual('bar');
    expect(pipe.transform(new Task('234', 'foo', 0, 0, new Feature()))).toEqual('foo');
  });
});
