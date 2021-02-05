import { Pipe, PipeTransform } from '@angular/core';
import { Task } from './task.material';

@Pipe({
  name: 'taskTitle'
})
export class TaskTitlePipe implements PipeTransform {
  transform(value: Task, ...args: unknown[]): unknown {
    if (!value) {
      return '';
    }

    const task = value as Task;
    return !task.name ? task.id : task.name;
  }
}
