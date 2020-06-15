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
  @Input() tasks: Task[];

  constructor(
    private taskService: TaskService,
    private currentUserService: CurrentUserService
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.unsubscribeLater(
      this.taskService.tasksUpdated.subscribe((updatedTasks: Task[]) => {
        for (const updatedTask of updatedTasks) { // through tasks
          for (const i in this.tasks) { // through indices
            if (this.tasks[i].id === updatedTask.id) {
              this.tasks[i] = updatedTask;
              break;
            }
          }
        }
      })
    );
  }

  public get selectedTaskId(): string {
    return this.taskService.getSelectedTask().id;
  }

  public isAssignedToCurrentUser(task: Task): boolean {
    return task.assignedUser === this.currentUserService.getUserId();
  }

  public onListItemClicked(id: string) {
    this.taskService.selectTask(this.tasks.find(t => t.id === id));
  }

  public taskTitle(task: Task): string {
    return !task.name ? task.id : task.name;
  }
}
