export class Project {
  constructor(public id: string,
              public name: string,
              public taskIds: string[],
              public description: string,
              public users?: string[],
              public owner?: string
  ) {
  }
}
