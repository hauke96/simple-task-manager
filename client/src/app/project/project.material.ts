import { User } from '../user/user.material';
import { Task, TaskDto } from '../task/task.material';

export class ProjectAddDto {
  constructor(public project: ProjectDto,
              public tasks: TaskDto[]) {
  }
}

export class ProjectDto {
  constructor(public id: string,
              public name: string,
              public description: string,
              public users: string[],
              public owner: string,
              public needsAssignment: boolean = true,
              public totalProcessPoints?: number,
              public doneProcessPoints?: number
  ) {
  }
}

export class Project {
  constructor(public id: string,
              public name: string,
              public description: string,
              public tasks: Task[],
              public users: User[],
              public owner: User,
              public needsAssignment: boolean = true,
              public totalProcessPoints?: number,
              public doneProcessPoints?: number
  ) {
  }
}
