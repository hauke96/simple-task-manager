import { AfterViewInit, Component, Input } from '@angular/core';
import { Task } from '../task.material';
import { TaskService } from '../task.service';
import { CurrentUserService } from '../../user/current-user.service';
import { Unsubscriber } from '../../common/unsubscriber';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent extends Unsubscriber implements AfterViewInit {
  // tslint:disable-next-line:variable-name
  private _tasks: Task[];

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.unsubscribeLater(
      this.taskService.tasksUpdated.subscribe((updatedTasks: Task[]) => {
        updatedTasks.forEach(u => {
          const index = this._tasks.map(t => t.id).indexOf(u.id);
          if (index !== -1) { // when "u" exists in the current tasks -> update it
            this._tasks[index] = u;
          }
          // No else case because tasks can't be added after project creation
        });
      })
    );
  }

  @Input()
  set tasks(values: Task[]) {
    this._tasks = values.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  get tasks(): Task[] {
    return this._tasks;
  }

  public get selectedTaskId(): string {
    return this.taskService.getSelectedTask().id;
  }

  public isAssignedToCurrentUser(task: Task): boolean {
    return !!task.assignedUser && task.assignedUser.uid === this.currentUserService.getUserId();
  }

  public onListItemClicked(id: string) {
    this.taskService.selectTask(this._tasks.find(t => t.id === id));
  }
}
