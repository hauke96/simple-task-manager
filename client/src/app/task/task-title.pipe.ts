import { Pipe, PipeTransform } from '@angular/core';
import { Task } from './task.material';

@Pipe({
    name: 'taskTitle',
    standalone: false
})
export class TaskTitlePipe implements PipeTransform {
  transform(value: Task | undefined, ...args: unknown[]): unknown {
    if (!value) {
      return '';
    }

    const task = value ;
    return !task.name ? task.id : task.name;
  }
}
