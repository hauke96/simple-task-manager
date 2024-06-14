import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Comment } from '../comment.material';
import { CurrentUserService } from '../../user/current-user.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss'
})
export class CommentComponent {

  public currentComments: Comment[] = [];

  @Input()
  public title: string;

  @Output()
  public commentSendClicked = new EventEmitter<string>();

  enteredComment: string;

  constructor(private currentUserService: CurrentUserService, private translateService: TranslateService) {
  }

  @Input()
  set comments(value: Comment[]) {
    this.currentComments = value;
    this.currentComments.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime());
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
