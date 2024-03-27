import { Injectable } from '@angular/core';
import { Comment, CommentDto } from './comment.material';
import { UserService } from '../user/user.service';
import { Observable } from 'rxjs';
import { User } from '../user/user.material';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  constructor(private userService: UserService) {
  }

  public toCommentsWithUserMap(dtos: CommentDto[], userMap: Map<string, User>): Comment[] {
    return dtos.map(dto => new Comment(
      dto.id,
      dto.text,
      userMap.get(dto.authorId) as User,
      new Date(dto.creationDate)
    ));
  }
}
