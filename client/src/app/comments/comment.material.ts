import { User } from '../user/user.material';

export class CommentDto {
  constructor(public id: number,
              public text: string,
              public authorId: string,
              public creationDate: Date) {
  }
}

export class CommentDraftDto {
  constructor(public text: string) {
  }
}

export class Comment {
  constructor(public id: number,
              public text: string,
              public author: User,
              public creationDate: Date) {
  }
}