import { User } from '../user/user.material';
import { Task, TaskDraftDto, TaskDto, TaskExport } from '../task/task.material';

export class ProjectAddDto {
  constructor(public project: ProjectDraftDto,
              public tasks: TaskDraftDto[]) {
  }
}

export class ProjectDraftDto {
  constructor(public name: string,
              public description: string,
              public users: string[],
              public owner: string
  ) {
  }
}

export class ProjectDto {
  constructor(public id: string,
              public name: string,
              public description: string,
              public users: string[],
              public tasks: TaskDto[],
              public owner: string,
              public needsAssignment: boolean = true,
              public creationDate: Date,
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
              public needsAssignment: boolean,
              public creationDate: Date,
              public totalProcessPoints?: number,
              public doneProcessPoints?: number
  ) {
  }
}

export class ProjectExport {
  constructor(public name: string,
              public description: string,
              public tasks: TaskExport[],
              public users: string[],
              public owner: string,
              public creationDate: Date) {
  }
}
