export class CommentDto {
  constructor(public id: number,
              public text: string,
              public authorId: string,
              public creationDate: Date) {
  }
}

export class Comment {
  constructor(public id: number,
              public text: string,
              public authorId: string,
              public creationDate: Date) {
  }
}