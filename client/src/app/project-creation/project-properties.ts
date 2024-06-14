import { JosmDataSource } from '../common/entities/josm-data-source';

export class ProjectProperties {
  constructor(
    public projectName: string,
    public maxProcessPoints: number,
    public projectDescription: string,
    public josmDataSource: JosmDataSource
  ) {
  }
}
