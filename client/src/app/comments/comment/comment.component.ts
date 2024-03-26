import { Component, Input } from '@angular/core';
import { Comment } from '../comment.material';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss'
})
export class CommentComponent {
  @Input()
  public comments: Comment[];
}
