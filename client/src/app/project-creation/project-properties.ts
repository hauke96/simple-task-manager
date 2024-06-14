import { JosmDataSource } from '../project/project.material';

export class ProjectProperties {
  constructor(
    public projectName: string,
    public maxProcessPoints: number,
    public projectDescription: string,
    public josmDataSource: JosmDataSource
  ) {
  }
}
