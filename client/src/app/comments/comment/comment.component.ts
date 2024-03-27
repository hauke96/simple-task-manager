import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Comment } from '../comment.material';
import { CurrentUserService } from '../../user/current-user.service';
import { User } from '../../user/user.material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss'
})
export class CommentComponent implements OnInit {
  @Input()
  public comments: Comment[];

  @Output()
  public commentSendClicked = new EventEmitter<string>();

  enteredComment: string;

  constructor(private currentUserService: CurrentUserService, private translateService: TranslateService) {
  }

  ngOnInit(): void {
    // this.comments = [
    //   ...this.comments,
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date()),
    //   new Comment(10000, 'some further text', new User('foo', '1'), new Date())
    // ];

    this.comments.sort((a, b) => a.creationDate.getDate() - b.creationDate.getDate());
  }

  public get currentLocale(): string {
    return this.translateService.currentLang;
  }

  public isFromCurrentUser(comment: Comment): boolean {
    return comment.author.uid === this.currentUserService.getUserId();
  }

  public onSendButtonClicked(): void {
    this.commentSendClicked.emit(this.enteredComment);
    this.enteredComment = '';
  }
}
