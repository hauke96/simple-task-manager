import { Injectable } from '@angular/core';
import { Comment, CommentDto } from './comment.material';
import { User } from '../user/user.material';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  public toCommentsWithUserMap(dtos: CommentDto[], userMap: Map<string, User>): Comment[] {
    return dtos.map(dto => new Comment(
      dto.id,
      dto.text,
      userMap.get(dto.authorId) as User,
      new Date(dto.creationDate)
    ));
  }
}
