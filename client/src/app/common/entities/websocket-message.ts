export class WebsocketMessage {
  constructor(
    public type: WebsocketMessageType,
    public id: string
  ) {
  }
}

export enum WebsocketMessageType {
  MessageType_ProjectAdded = 'project_added',
  MessageType_ProjectUpdated = 'project_updated',
  MessageType_ProjectDeleted = 'project_deleted',
  MessageType_ProjectUserRemoved = 'project_user_removed',
}
