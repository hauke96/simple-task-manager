export class WebsocketMessage {
  constructor(
    public type: string,
    public data: any
  ) {
  }
}

export enum WebsocketMessageType {
  MessageType_ProjectAdded = 'project_added',
  MessageType_ProjectUpdated = 'project_updated',
  MessageType_ProjectDeleted = 'project_deleted',

  MessageType_TaskUpdated = 'task_updated'
}
