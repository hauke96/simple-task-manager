import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Output()
  public taskCommentSelected = new EventEmitter<Task>();

  private currentTasks: Task[];

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
          const index = this.currentTasks.map(t => t.id).indexOf(u.id);
          if (index !== -1) { // when "u" exists in the current tasks -> update it
            this.currentTasks[index] = u;
          }
          // No else case because tasks can't be added after project creation
        });
      })
    );
  }

  @Input()
  set tasks(values: Task[]) {
    this.currentTasks = values
      .sort((a: Task, b: Task) => {
        if (a.isDone && !b.isDone) {
          return 1;
        }
        if (!a.isDone && b.isDone) {
          return -1;
        }

        return (a.name ?? a.id).localeCompare((b.name ?? b.id));
      });
  }

  get tasks(): Task[] {
    return this.currentTasks;
  }

  public get selectedTaskId(): string {
    return this.taskService.getSelectedTask()?.id ?? '';
  }

  public isAssignedToCurrentUser(task: Task): boolean {
    return !!task.assignedUser && task.assignedUser.uid === this.currentUserService.getUserId();
  }

  public onListItemClicked(id: string): void {
    const clickedTask = this.currentTasks.find(t => t.id === id);
    if (!clickedTask) {
      return;
    }

    this.taskService.selectTask(clickedTask);
  }

  public onListItemCommentClicked(task: Task): void {
    this.taskCommentSelected.emit(task);
  }
}
